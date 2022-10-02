/* eslint-disable @typescript-eslint/no-explicit-any */
import { completedKata } from "./assets/completedKata"
import { join } from "node:path"
import fs from "node:fs"
import Axios from "axios"
import json2md from "json2md"

// Variables
const rootFolder = "/Users/jdold07/Dropbox/Code/cwTest/Codewars_Solutions"
const myLanguages = new Map([
  ["javascript", { name: "JS", extension: "js" }],
  ["typescript", { name: "TS", extension: "ts" }],
  ["coffeescript", { name: "CS", extension: "coffee" }],
  ["python", { name: "PY", extension: "python" }],
  ["swift", { name: "Swift", extension: "swift" }]
])

// Fetch completed kata detail from Codewars API & process folders & markdown description file
async function processCompletedKata() {
  for (const kata of completedKata.kata) {
    try {
      const response = await Axios.get(`https://www.codewars.com/api/v1/code-challenges/${kata.id}`)
      const kataCamelCase = response.data.slug.replace(
        /-(\w)/g,
        (_: string, $1: string) => `${$1.slice(0, 1).toUpperCase()}${$1.slice(1)}`
      )
      const kataSnakeCase = response.data.slug.replace(/-/g, "_")
      const rankFolder = `${Math.abs(response.data.rank.id)}_Kyu_Kata`
      const fullPath: string = join(rootFolder, rankFolder, kataSnakeCase)
      createFolders(response.data, fullPath, kataSnakeCase, kataCamelCase)
      try {
        fs.writeFileSync(join(fullPath, `${kataSnakeCase}.md`), createMarkdown(response.data), { mode: 644 })
      } catch (err) {
        console.log(`Something went wrong while writing MD file\nError: ${err}`)
        throw Error(`Something went wrong while writing MD file\nError: ${err}`)
      }
    } catch (err: any) {
      console.log(`Something has gone wrong in main flow\nError: ${err}`)
      throw Error(`Something has gone wrong in main flow\nError: ${err}`)
    }
  }
  console.log("Success!  It looks like everything has completed as expected.")
}

// Create folders, code files & code test files for Kata
function createFolders(kata: any, fullPath: string, kataSnakeCase: string, kataCamelCase: string) {
  try {
    fs.mkdirSync(fullPath, { recursive: true, mode: 755 })
  } catch (err) {
    console.log(`Something went wrong while creating Kata directory\nError: ${err}`)
    throw Error(`Something went wrong while creating Kata directory\nError: ${err}`)
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
      } catch (err) {
        console.log(`Something went wrong while creating the ${v} directory\nError: ${err}`)
        throw Error(`Something went wrong while creating the ${v} directory\nError: ${err}`)
      }
      const kataFilename = v === "python" ? kataSnakeCase : kataCamelCase
      try {
        fs.writeFileSync(join(pathLang, `${kataFilename}.${extLang}`), "", { flag: "wx", mode: 646 })
      } catch (err) {
        console.log(`Something went wrong while writing ${extLang} code file\nError: ${err}`)
        throw Error(`Something went wrong while writing ${extLang} code file\nError: ${err}`)
      }
      try {
        fs.writeFileSync(
          join(pathLang, v === "python" ? `${kataFilename}_test.${extLang}` : `${kataFilename}.Test.${extLang}`),
          "",
          { flag: "wx", mode: 644 }
        )
      } catch (err) {
        console.log(`Something went wrong while writing ${extLang} test file\nError: ${err}`)
        throw Error(`Something went wrong while writing ${extLang} test file\nError: ${err}`)
      }
    })
}

// json2md mapping / layout to generate markdown file content
function createMarkdown(kata: any) {
  try {
    return json2md([
      { h1: `<div style:"color:${kata.rank.color}">${kata.rank.name} - ${kata.name}<div />` },
      {
        h5: `**ID**: [${kata.id}](${kata.url}) | **Slug**: [${kata.slug}](${
          kata.url
        }) | **Category**: \`${kata.category.toUpperCase()}\` | **Rank**: <div style:"color:${kata.rank.color}">${
          kata.rank.name
        }<div />`
      },
      {
        h5: `**First Published**: ${kata.publishedAt.split("T")[0]} **by** [${kata.createdBy.username}](${
          kata.createdBy.url
        }) | **Approved**: ${kata.approvedAt.split("T")[0]} **by** [${kata.approvedBy.username}](${kata.approvedBy.url})`
      },
      { h5: `**Languages**: ${kata.languages.join(", ")}` },
      { hr: "" },
      { h2: "Kata Description" },
      { p: kata.description },
      { hr: "" },
      {
        p: `🏷 \`${kata.tags.join(" | ").toUpperCase()}\`<div style="text-align:right">[View this Kata on Codewars.com](${
          kata.url
        })<div />`
      },
      {
        img: {
          title: "JDOld07 Codewars Badge",
          source: "https://www.codewars.com/users/jdold07/badges/large",
          alt: "JDOld07 Codewars Badge"
        }
      },
      { hr: "" },
      {
        h6: "*This Kata description was compiled by [**JDOld07**](https://tpstech.dev) with data provided by the [Codewars.com](https://www.codewars.com) API.  The solutions in this repo associated with this kata are my solutions unless otherwise noted in the code file.  Test cases are generally those as provided in the Kata, but may include additional test cases I created while coding my solution.  My solutions are not always commented as the solutions are rarely submitted with comments.*"
      }
    ])
  } catch (err) {
    console.log(`Something has gone wrong executing json2md\nError: ${err}`)
    throw Error(`Something has gone wrong executing json2md\nError: ${err}`)
  }
}

// Run this bitch!
processCompletedKata()
