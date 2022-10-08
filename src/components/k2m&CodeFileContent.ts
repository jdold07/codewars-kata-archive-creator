/* eslint-disable @typescript-eslint/no-explicit-any */
import completedKata from "../../private/assets/completedKata"
import scrapeHTML from "./scrapper"
import { join } from "node:path"
import fs from "node:fs"
import Axios from "axios"
import json2md from "json2md"

// Variables
const date = new Date().toISOString().split("T")[0]
const rootFolder = "/Users/jdold07/Dropbox/Code/Codewars_Solutions"
const myLanguages = new Map([
  ["javascript", { name: "JavaScript", extension: "js" }],
  ["typescript", { name: "TypeScript", extension: "ts" }],
  ["coffeescript", { name: "CoffeeScript", extension: "coffee" }],
  ["python", { name: "Python", extension: "py" }],
  ["swift", { name: "Swift", extension: "swift" }]
])
const html = scrapeHTML()

// Fetch completed kata detail from Codewars API & process folders & markdown description file
async function processKatas() {
  for (const solution of html) {
    try {
      const mapSolution = await Axios.get(`https://www.codewars.com/api/v1/code-challenges/${solution.id}`)
      solution.slug = mapSolution.data.slug
      console.log(`Mapping solution ID ${solution.id} to slug successful`)
    } catch (err) {
      console.warn(`Issue mapping ID to Slug ${solution.id}\n${err}`)
    }
  }
  for (const kata of completedKata.kata) {
    try {
      const response = await Axios.get(`https://www.codewars.com/api/v1/code-challenges/${kata.id}`)
      const kataCamelCase = response.data.slug.replace(
        /-(\w)/g,
        (_: string, $1: string) => `${$1.slice(0, 1).toUpperCase()}${$1.slice(1)}`
      )
      const kataSnakeCase = response.data.slug.replace(/-/g, "_")
      const rankFolder = `${Math.abs(response.data.rank.id) || "BETA"}_Kyu_Kata`
      const fullPath: string = join(rootFolder, rankFolder, kataSnakeCase)
      writePathsAndFiles(response.data, fullPath, kataSnakeCase, kataCamelCase)
      try {
        fs.writeFileSync(join(fullPath, `${kataSnakeCase}.md`), generateMarkdownString(response.data, kata), { mode: 644 })
        console.log(`Writing markdown description file for ${kata.id} successful`)
      } catch (err) {
        console.warn(`Issue writing ${kata.slug} MD file\n${err}`)
      }
    } catch (err: any) {
      console.error(`Something halted main app flow\n${err}`)
      // throw Error(`Something stopped main app flow\n${err}`)
    }
  }
  console.log("Process COMPLETE!  It looks like everything has completed as expected.")
}

// Create file paths, code files & code test files for Kata
function writePathsAndFiles(kata: any, fullPath: string, kataSnakeCase: string, kataCamelCase: string) {
  try {
    fs.mkdirSync(fullPath, { recursive: true, mode: 755 })
    console.log(`Create /${kataSnakeCase} directory`)
  } catch (err) {
    console.warn(`Create /${kataSnakeCase} directory\n${err}`)
  }
  Array.from(myLanguages.keys())
    .filter((v) => kata.languages.includes(v))
    .forEach((v: string) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const pathLang = join(fullPath, myLanguages.get(v)!.name)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const extLang = myLanguages.get(v)!.extension
      try {
        fs.mkdirSync(pathLang, { recursive: true, mode: 755 })
        console.log(`Create /${kataSnakeCase}/${pathLang} directory`)
      } catch (err) {
        console.warn(`Create /${kataSnakeCase}/${v} directory\n${err}`)
      }
      const kataFilename = v === "python" ? kataSnakeCase : kataCamelCase
      try {
        const merged = mergeDataSources(kata, v)
        fs.writeFileSync(join(pathLang, `${kataFilename}.${extLang}`), formatCodeString(merged, v), { flag: "w", mode: 644 })
        console.log(`Write ${merged.id} ${v} CODE file`)
      } catch (err) {
        console.warn(`Write ${kataFilename}.${extLang} CODE file\n${err}`)
      }
      try {
        fs.writeFileSync(
          join(pathLang, v === "python" ? `${kataFilename}_test.${extLang}` : `${kataFilename}.Test.${extLang}`),
          "",
          { flag: "wx", mode: 644 }
        )
        console.log(`Write ${kata.id} ${v} TEST file`)
      } catch (err) {
        console.warn(`Write ${kataFilename}.${extLang} TEST file\n${err}`)
      }
    })
}

// json2md mapping / layout to generate markdown file content
function generateMarkdownString(kata: any, completed: any): string {
  try {
    console.log(`Parsing markdown format for ${kata.id}`)
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

// Combine completed kata detail with scraped HTML data ready for writing to code files
function mergeDataSources(kata: any, lang: string) {
  const index = html.findIndex((v: any) => v.slug === kata.slug && v.language === lang)
  console.log(`Combing data sources for ${kata.id} in ${lang} successful`)
  return {
    id: kata.id,
    name: kata.name,
    slug: kata.slug,
    rank: kata.rank.name,
    tags: kata.tags,
    url: kata.url,
    language: lang,
    code: html[index]?.code || ""
  }
}

// Format string for code file
function formatCodeString(merged: any, lang: string) {
  if (lang === "python" || lang === "coffeescript") {
    console.log(`Code string for ${merged.id} in ${lang} successful`)
    return `# ${merged?.rank} - ${merged?.name}  [ ID: ${merged?.id}  (${merged?.slug}) ]\n# URL: ${
      merged.url
    }\n# Category: ${merged?.category?.toUpperCase() || "NONE"}  |  Tags: ${
      merged?.tags?.join(" | ").toUpperCase() || "NONE"
    }\n# ${"*".repeat(78)}\n${merged.code || ""}\n`
  } else {
    console.log(`Code string for ${merged.id} in ${lang} successful`)
    return `// ${merged?.rank} - ${merged?.name}  [ ID: ${merged?.id}  (${merged?.slug}) ]\n// URL: ${
      merged.url
    }\n// Category: ${merged?.category?.toUpperCase()}  |  Tags: ${
      merged?.tags?.join(" | ").toUpperCase() || "NONE"
    }\n// ${"*".repeat(77)}\n${merged.code || ""}\n`
  }
}

// Run this bitch!
processKatas()
