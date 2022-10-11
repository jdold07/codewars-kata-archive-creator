/* eslint-disable @typescript-eslint/no-explicit-any */
import { completedKata as existingCompleted } from "../../private/assets/completedKata"
import { formatAndMergeSolutionData } from "./getSolutionCode"
import * as config from "../../private/components/config"
import { format } from "prettier"
import fs from "node:fs"
import { join } from "node:path"
import Axios from "axios"
import axiosThrottle from "axios-request-throttle"
import cheerio from "cheerio"
import json2md from "json2md"

// Axios request throttling to prevent too many requests error from codewars.com on large imports
axiosThrottle.use(Axios, { requestsPerSecond: 1 })

// Variables
const date = new Date().toISOString().split("T")[0]
const kataTests: { id: string; language: string; code: string } = { id: "", language: "", code: "" }
const rootFolder = config.rootPath
const SESSION_ID = config.sessionID
const myLanguages = config.myLanguages

// Fetch list of completed Katas for obtaining detail on completed languages & completion date etc
async function getCompletedKatasJSON() {
  try {
    const resCompletedKata = await Axios.get(
      `http://www.codewars.com/api/v1/users/${config.userID}/code-challenges/completed?page=0`
    )
    const completedKata = resCompletedKata?.data?.data?.filter(
      (v: any) =>
        !existingCompleted.kata.some((existing) => existing.id === v.id) ||
        !v.completedLanguages.every((completedLang: string) =>
          existingCompleted.kata[
            existingCompleted.kata.findIndex((existing) => existing.id === v.id)
          ].completedLanguages.includes(completedLang)
        )
    )
    completedKata.forEach((kata: any) => {
      if (existingCompleted.kata.find((v) => v.id === kata.id)) {
        existingCompleted.kata[existingCompleted.kata.findIndex((v) => v.id === kata.id)].completedLanguages =
          kata.completedLanguages
      } else {
        existingCompleted.kata.unshift(kata)
      }
      fs.writeFileSync(join("./private/assets/completedKata.ts"), JSON.stringify(existingCompleted), {
        flag: "w",
        encoding: "utf8",
        mode: 644
      })
    })
    return completedKata
  } catch (err) {
    console.error(`There was a problem fetching Completed Kata list: ${err}`)
  }
}

// Fetch completed kata detail from Codewars API & process folders & markdown description file
async function processKatas() {
  const completedKatas = await getCompletedKatasJSON()
  for (const kata of completedKatas) {
    try {
      const response = await Axios.get(`https://www.codewars.com/api/v1/code-challenges/${kata.id}`)
      const rankFolder = `kata-${Math.abs(response.data.rank.id) || "beta"}-kyu`
      response.data.slug = response.data.slug.replace(/^(\d+)/, "_$1")
      const fullPath = join(rootFolder, rankFolder, response.data.slug)

      writePathsAndFiles(response.data, fullPath, kata)
    } catch (err: any) {
      console.error(`Error during processing of Katas!!!\n${err}`)
    }
  }
  console.log("Processing COMPLETE!  Check output path to confirm everything has completed as expected.")
}

/**
 * Helper function for filename case convention specific to individual languages
 * @Param: slug <string> Kata name in slug format (eg this-kata-name)
 * @Param: flag <string> Identifier for case type ("c", "s", default="no")
 * @Return => <string> Kata slug reformatted to language case convention
 **/
const changeCase = (slug: string, flag = "no") =>
  flag === "c"
    ? slug.replace(/-(\w)/g, (_: string, $1: string) => `${$1.slice(0, 1).toUpperCase()}${$1.slice(1)}`)
    : slug.replace(/-/g, "_")

// Create file paths, code files & code test files for Kata
function writePathsAndFiles(kata: any, fullPath: string, completionDetail: any) {
  // Create individual Kata root path
  try {
    fs.mkdirSync(fullPath, { recursive: true, mode: 755 })
    console.log(`Create /${kata.slug} directory`)
  } catch (err) {
    console.warn(`Error creating /${kata.slug} directory\n${err}`)
  }
  // Generate and write Kata description markdown file //! Set to OVERWRITE any existing markdown description
  try {
    fs.writeFileSync(join(fullPath, `${kata.slug}.md`), generateMarkdownString(kata, completionDetail), {
      flag: "w",
      mode: 644
    })
    console.log(`Writing markdown description file for ${kata.slug}`)
  } catch (err) {
    console.warn(`Error writing ${kata.slug} MD file\n${err}`)
  }

  //TODO - Break this code block down into components - too much happening in one block
  Array.from(myLanguages.keys())
    .filter((v) => kata.languages.includes(v) && completionDetail?.completedLanguages.includes(v))
    .forEach(async (v: string) => {
      // Fetch test code from Codewars.com specific kata solutions page
      try {
        const response = await Axios.get(`https://www.codewars.com/kata/${kata.id}/solutions/${v}`, {
          headers: { Cookie: SESSION_ID }
        })
        const $ = cheerio.load(response.data)
        const parser = v === "javascript" ? "espree" : v === "typescript" ? "typescript" : undefined
        const testsCode = parser
          ? format($("#kata-details-description", response.data).siblings().find("code").text(), {
              semi: false,
              printWidth: 125,
              trailingComma: "none",
              parser: parser
            })
          : $("#kata-details-description", response.data).siblings().find("code").text()

        Object.assign(kataTests, { id: kata.id, language: v, code: testsCode })

        console.log("Retrieved Kata TESTS data from Codewars.com")
      } catch (err) {
        console.error(`Error fetching Kata TESTS from Codewars.com for ${kata.id} in ${v}\n${err}`)
      }

      // Set language path
      const langPath = join(fullPath, v)
      // Set language file extension
      const langExt = myLanguages.get(v)?.extension
      // Set filename case type
      const kataFilename = v === "python" ? changeCase(kata.slug, "s") : changeCase(kata.slug, "c")
      // Merge solution code & tests code into Kata details data
      const KATA = await mergeData(kata, v)

      // Create individual Kata language path
      if (KATA.code !== "") {
        try {
          fs.mkdirSync(langPath, { recursive: true, mode: 755 })
          console.log(`Create /${kata.slug}/${v} directory`)
        } catch (err) {
          console.warn(`Error creating /${kata.slug}/${v} directory\n${err}`)
        }

        // Generate & write solution code file //? Set to NOT write if file exists
        try {
          fs.writeFileSync(join(langPath, `${kataFilename}.${langExt}`), formatString(KATA, v, kataFilename, "code"), {
            flag: "wx",
            mode: 644
          })
          console.log(`Writing ${kataFilename}.${langExt} CODE file`)
        } catch (err) {
          console.warn(`Error writing ${kataFilename}.${langExt} CODE file\n${err}`)
        }

        // Generate & write tests code file //? Set to NOT write if file exists
        try {
          fs.writeFileSync(
            join(langPath, v === "python" ? `${kataFilename}_test.${langExt}` : `${kataFilename}.Test.${langExt}`),
            formatString(KATA, v, kataFilename, "test"),
            { flag: "wx", mode: 644 }
          )
          console.log(`Writing ${kataFilename}.${langExt} TESTS file`)
        } catch (err) {
          console.warn(`Error writing ${kataFilename}.${langExt} TESTS file\n${err}`)
        }
      }
    })
}

// json2md mapping / layout to generate markdown file content
function generateMarkdownString(kata: any, completed: any): string {
  try {
    console.log(`Parsing markdown format for ${kata.slug}`)
    return json2md([
      { h1: `${kata?.rank?.name || "BETA"} - ${kata?.name}` },
      {
        h5: `**ID**: [${kata?.id || "*not available*"}](${kata?.url}) | **Slug**: [${kata?.slug || "*not available*"}](${
          kata?.url
        }) | **Category**: \`${kata?.category?.toUpperCase() || "NONE"}\` | **Rank**: <span style="color:${
          kata?.rank?.color || "grey"
        }">${kata?.rank?.name || "*BETA*"}</span>`
      },
      {
        h5: `**First Published**: ${kata?.publishedAt?.split("T")[0] || "*not available*"} ***by*** [${
          kata?.createdBy?.username || "*not available*"
        }](${kata?.createdBy?.url || "https://www.codewars.com"}) | **Approved**: ${
          kata?.approvedAt?.split("T")[0] || "*not available*"
        } ***by*** [${kata?.approvedBy?.username || "*not available*"}](${
          kata?.approvedBy?.url || "*https://www.codewars.com*"
        })`
      },
      { h5: `**Languages Available**: ${kata?.languages?.join(", ") || "*not available*"}` },
      {
        h5: `**My Completed Languages**: ${
          completed?.completedLanguages?.join(", ") || "*not available*"
        } ***as at*** ${date} | **Originally completed**: ${completed?.completedAt?.split("T")[0] || "*not available*"}`
      },
      { hr: "" },
      { h2: "Kata Description" },
      {
        p:
          kata?.description ||
          `# Ooops ... Description not available\n### Description was not available for [${kata?.id}](${kata?.url}) at the time of markdown generation.`
      },
      { hr: "" },
      { p: `🏷 \`${kata?.tags?.join(" | ").toUpperCase() || "NONE"}\`` },
      { p: `[View this Kata on Codewars.com](${kata?.url || "https://www.codewars.com"})` },
      { img: { title: "JDOld07 Codewars Badge", source: "https://www.codewars.com/users/jdold07/badges/large" } },
      { hr: "" },
      {
        h6: "*This Kata description was compiled by [**JDOld07**](https://tpstech.dev) with data provided by the [Codewars.com](https://www.codewars.com) API.  The solutions in this repo associated with this kata are my solutions unless otherwise noted in the code file.  Test cases are generally those as provided in the Kata, but may include additional test cases I created while coding my solution.  My solutions are not always commented as the solutions are rarely submitted with comments.*"
      }
    ])
  } catch (err) {
    console.log(`Possible issue while executing json2md for ${kata?.name}\n${err}`)
    return `# Ooops, something went wrong!\n### An error occurred while generating the Markdown file's content.  [${kata?.id}](${kata?.url})`
  }
}

// Merge Kata solution/s code & tests code with Kata detail into a single object
async function mergeData(kata: any, lang: string) {
  const solutions = await formatAndMergeSolutionData()
  const index = solutions.findIndex((v: any) => v.id === kata.id && v.language === lang)
  console.log(`Added solution & tests code data for ${kata.slug} in ${lang}`)
  return Object.assign(kata, { code: solutions[index]?.code || "", tests: kataTests?.code })
}

// Format string for writing code file || test file
function formatString(KATA: any, lang: string, fileName: string, flag: string): string {
  console.log(`Formatting ${flag === "code" ? "CODE" : "TESTS"} string for ${KATA.slug} in ${lang}`)

  // HASH COMMENT languages formatting
  if (lang === "python" || lang === "coffeescript") {
    //? COMMON to all HASH COMMENT languages
    if (flag === "test") {
      // TEST STRING - Reformat export, imports & test config for local use
      // Remove initial any default comment block
      KATA.tests = KATA?.tests.replace(/^#(?:.|[\n\r\u2028\u2029#])*?(?=[\w`'"]{2,})(?<=[\n\r\u2028\u2029#])/, "")
      // Remove any trailing default comment block
      KATA.tests = KATA?.tests.replace(/(?<=.\n|\r|\u2028|\u2029)(?:#.*|\n|\r|\u2028|\u2029)*(?=$)/, "")
    }

    //? Python specific formatting
    if (lang === "python") {
      if (flag === "code") {
        // CODE STRING - Reformat export, imports & test config for local use
      }
      if (flag === "test") {
        // TEST STRING - Reformat export, imports & test config for local use
        // Remove any existing import of Codewars framework & import of "solution" module
        KATA.tests = KATA?.tests.replace(/import codewars_test as test/g, "").replace(/from solution import \w+/g, "")
        // Insert import for Codewars python test framework & import CODE module to TEST
        KATA.tests = `import codewars_test as test\nfrom ${fileName} import ${
          (KATA?.tests?.match(/(?<=equals\()(\w+)(?=\()/) || ["UNKNOWN"])[0]
        }\n\n\n${KATA.tests}`
      }
    }

    //? CoffeeScript specific formatting
    if (lang === "coffeescript") {
      if (flag === "code") {
        // CODE STRING - Reformat export, imports & test config for local use
        // Append export group of top level declarations
        KATA.code = `${KATA?.code}\n\nmodule.exports = { ${
          KATA?.code?.match(/^(\w+)(?=(?:\s=\s\(\w+).*(?:->|=>))/gm) || ["UNKNOWN"]?.join(", ")
        } }`
      }
      if (flag === "test") {
        // TEST STRING - Reformat export, imports & test config for local use
        // Remove any existing reference to Test
        KATA.tests = KATA?.tests.replace(/\bTest\./g, "")
        // Replace assertions with Chai types
        KATA.tests = KATA?.tests
          .replace(/assertEquals/g, "assert.strictEqual")
          .replace(/(assertDeepEquals|assertSimilar)/g, "assert.deepEqual")
        // Insert import for Chai & CODE file/module
        KATA.tests = `\n{ assert } = require "chai"\n{ ${
          (KATA?.tests.match(/(?<=assert\.\w+(?:\s|\s?\())(\w+)(?=(?:\s|\)|\())/) || ["UNKNOWN"])[0]
        } } = require "./${fileName}"\n\n${KATA?.tests}\n`
      }
    }

    // Return formatted header & reconfigured CODE || TEST strings for HASH COMMENT languages
    return `#+ ${"=".repeat(117)}\n#+\n#+ ${KATA?.rank?.name} - ${KATA?.name}  [ ID: ${KATA?.id} ] (${
      KATA?.slug
    })\n#+ URL: ${KATA.url}\n#+ Category: ${KATA?.category?.toUpperCase() || "NONE"}  |  Tags: ${
      KATA?.tags?.join(" | ").toUpperCase() || "NONE"
    }\n#+\n#+ ${"=".repeat(117)}\n\n${(flag === "code" ? KATA?.code : KATA?.tests) || ""}\n`
  }

  // DOUBLE FORWARD SLASH COMMENT languages formatting
  if (lang === "javascript" || lang === "typescript" || lang === "swift") {
    //? COMMON to all DOUBLE FORWARD SLASH COMMENT languages
    if (flag === "test") {
      // TEST STRING - Reformat export, imports & test config for local use
      // Remove initial any default comment block
      KATA.tests = KATA?.tests.replace(/^(?:(?:\/\/|\/\*).*|\n|\r|\u2028|\u2029|\*\/)*(?=\w)/, "")
      // Remove any trailing default comment block
      KATA.tests = KATA?.tests.replace(/(?<=.\n|\r|\u2028|\u2029)(?:(?:\/\/|\/\*).*|\n|\r|\u2028|\u2029|\*\/)*(?=$)/, "")
    }

    //? JavaScript specific formatting
    if (lang === "javascript") {
      if (flag === "code") {
        // CODE STRING - Reformat export, imports & test config for local use
        // Append export object that includes all top level const and/or function names
        KATA.code = `${KATA?.code}\n\nmodule.exports = { ${
          KATA?.code?.match(/(?:(?<=(?:^const|^function|^class)\s)(\w+)(?=(?:\s=\s\(|\s?\()))|^\w+(?=\s=[\s\n]+\()/gm) ||
          ["UNKNOWN"]?.join(", ")
        } }`
      }

      if (flag === "test") {
        // TEST STRING - Reformat export, imports & test config for local use
        // Remove any existing reference to require/import chai or ./solution
        KATA.tests = KATA?.tests.replace(/^.*(?:chai).*$/gm, "").replace(/^.*(?:"\.\/).*$/gm, "")
        // Replace assertions with Chai types
        KATA.tests = KATA?.tests
          .replace(/expectError/g, "assert.throws")
          .replace(/expectNoError/g, "assert.doesNotThrow")
          .replace(/assertEquals/g, "assert.strictEqual")
          .replace(/(assertDeepEquals|assertSimilar)/g, "assert.deepEqual")
          .replace(/assertNotSimilar/g, "assert.notDeepEqual")
          .replace(/assertNotEquals/g, "assert.notStrictEqual")
          .replace(/(assertFuzzyEquals|assertApproxEquals)/g, "assert.approximately")
          .replace(/\bTest.log\b/g, "console.log")
        // Check for use of old Codewars JS Framework utility methods to a filtered array of any utilities present
        const cwUtilMethods = ["randomNumber", "randomToken", "randomize", "sample", "inspect"].filter((util) =>
          new RegExp(`Test.${util}`).test(KATA?.tests)
        )
        // Insert import for Chai, old Codewars framework utilities & CODE file/module
        KATA.tests = `${
          cwUtilMethods.length ? `\nconst { ${cwUtilMethods.join(", ")} } = require("../../../utils/cwUtils")` : ""
        }\nconst { assert${/Test.expect/.test(KATA?.tests) ? ", expect" : ""} } = require("chai")\nconst { ${
          (KATA?.tests.match(/(?<=(?:assert|expect)\.\w+(?:\s|\s?\())(\w+)(?=(?:\s|\s?\())/) || ["UNKNOWN"])[0]
        } } = require("./${fileName}")\n\n${KATA?.tests}\n`
        // Remove any existing reference to Test
        KATA.tests = KATA?.tests.replace(/\bTest\./g, "")
      }
    }

    //? TypeScript specific formatting
    if (lang === "typescript") {
      if (flag === "code") {
        // CODE STRING - Reformat export, imports & test config for local use
        // Remove existing exports on top level const & functions & any object exports
        KATA.code = KATA?.code.replace(/^export\s(?:(?:default\s)?(?=(?:const|let|var|function))|({.*)?$)/g, "")
        // Append export object that includes all top level const and/or function names
        KATA.code = `${KATA?.code}\n\nexport { ${
          KATA?.code?.match(/(?<=(?:^const|^function|^class)\s)(\w+)(?=(?:\s=\s\(|\s?\())/gm) || ["UNKNOWN"]?.join(", ")
        } }`
      }

      if (flag === "test") {
        // TEST STRING - Reformat export, imports & test config for local use
        // Remove any existing reference to Test.
        // KATA.tests = KATA?.tests.replace(/\bTest\./g, "")
        // Replace assertions with Chai types
        // KATA.tests = KATA?.tests.replace(/assert.equal/g, "assert.strictEqual")
        // Remove any existing reference to require/import chai or ./solution
        KATA.tests = KATA?.tests.replace(/^.*(?:chai).*$/gm, "").replace(/^.*(?:"\.\/).*$/gm, "")
        // Insert import for Chai & CODE file/module
        KATA.tests = `\nimport { assert } from ("chai")\nimport { ${
          (KATA?.tests.match(/(?<=(?:assert|expect)\.\w+(?:\s|\s?\())(\w+)(?=(?:\s|\s?\())/) || ["UNKNOWN"])[0]
        } } from ("./${fileName}")\n\n${KATA?.tests}\n`
      }
    }

    //? Swift specific formatting
    if (lang === "swift") {
      if (flag === "code") {
        // CODE STRING - Reformat export, imports & test config for local use
      }
      if (flag === "test") {
        // TEST STRING - Reformat export, imports & test config for local use
      }
    }

    // Return formatted header & reconfigured CODE || TEST strings for DOUBLE FORWARD SLASH COMMENT languages
    return `//+ ${"=".repeat(116)}\n//+\n//+ ${KATA?.rank?.name} - ${KATA?.name}  [ ID: ${KATA?.id} ] (${
      KATA?.slug
    })\n//+ URL: ${KATA.url}\n//+ Category: ${KATA?.category?.toUpperCase()}  |  Tags: ${
      KATA?.tags?.join(" | ").toUpperCase() || "NONE"
    }\n//+\n//+ ${"=".repeat(116)}\n\n${(flag === "code" ? KATA?.code : KATA?.tests) || ""}\n`
  }

  //! CATCHALL - Should not ever hit this!  Provides a default return or break for TS
  console.error(`CATCHALL while formatting ${flag === "code" ? "CODE" : "TESTS"} string for ${KATA.slug} in ${lang}`)
  throw Error("UNKOWN LANGUAGE ENCOUNTERED ... Review before re-processing")
}

// Fire it up!
processKatas()
