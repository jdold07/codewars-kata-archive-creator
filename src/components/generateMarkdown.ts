/* eslint-disable @typescript-eslint/no-explicit-any */
import json2md from "json2md"

// json2md mapping / layout to generate markdown file content
export function generateMarkdownString(kata: any, completed: any = new Date()): string {
  const date = new Date().toISOString().split("T")[0]
  try {
    console.log(`Parsing markdown format for ${kata?.id}`)
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
      }, //!TODO - From here down.  Need to see if I can gat around needing completed dates and languages.
      { h5: `**Languages Available**: ${kata?.languages?.join(", ") || "*not available*"}` },
      {
        h5: `**My Completed Languages**: ${
          completed?.completedLanguages?.join(", ") || "*not available*"
        } ***as at*** ${date} | **Originally completed**: ${completed?.completedAt?.split("T")[0]}`
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

export default generateMarkdownString
