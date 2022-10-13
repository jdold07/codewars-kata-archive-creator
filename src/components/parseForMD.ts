/* eslint-disable @typescript-eslint/no-explicit-any */
import json2md from "json2md"
import path from "node:path"

export default function parseForMD(kataDetails: any): string {
  /** json2md mapping / layout to generate markdown file content
   * @Param kataDetails
   * @Return json2md:string (filteredKataDetails parsed into markdown layout as a string)
   **/
  try {
    const date = new Date().toISOString().split("T")[0]

    console.log(`Parsing markdown format for ${kataDetails.slug}`)

    return json2md([
      { h1: `${kataDetails?.rank?.name || "BETA"} - ${kataDetails?.name}` },
      {
        h5: `**ID**: [${kataDetails?.id || "*not available*"}](${kataDetails?.url}) | **Slug**: [${
          kataDetails?.slug || "*not available*"
        }](${kataDetails?.url}) | **Category**: \`${
          kataDetails?.category?.toUpperCase() || "NONE"
        }\` | **Rank**: <span style="color:${kataDetails?.rank?.color || "grey"}">${
          kataDetails?.rank?.name || "*BETA*"
        }</span>`
      },
      {
        h5: `**First Published**: ${kataDetails?.publishedAt?.split("T")[0] || "*not available*"} ***by*** [${
          kataDetails?.createdBy?.username || "*not available*"
        }](${kataDetails?.createdBy?.url || "https://www.codewars.com"}) | **Approved**: ${
          kataDetails?.approvedAt?.split("T")[0] || "*not available*"
        } ***by*** [${kataDetails?.approvedBy?.username || "*not available*"}](${
          kataDetails?.approvedBy?.url || "*https://www.codewars.com*"
        })`
      },
      { h5: `**Languages Available**: ${kataDetails?.languages?.join(", ") || "*not available*"}` },
      {
        h5: `**My Completed Languages**: ${
          kataDetails?.completedLanguages?.join(", ") || "*not available*"
        } ***as at*** ${date} | **Originally completed**: ${kataDetails?.completedAt?.split("T")[0] || "*not available*"}`
      },
      { hr: "" },
      { h2: "Kata Description" },
      {
        p:
          kataDetails?.description ||
          `# Ooops ... Description not available\n### Description was not available for [${kataDetails?.id}](${kataDetails?.url}) at the time of markdown generation.`
      },
      { hr: "" },
      { p: `🏷 \`${kataDetails?.tags?.join(" | ").toUpperCase() || "NONE"}\`` },
      { p: `[View this Kata on Codewars.com](${kataDetails?.url || "https://www.codewars.com"})` },
      { img: { title: "JDOld07 Codewars Badge", source: "https://www.codewars.com/users/jdold07/badges/large" } },
      { hr: "" },
      {
        h6: "*This Kata description was compiled by [**JDOld07**](https://tpstech.dev) with data provided by the [Codewars.com](https://www.codewars.com) API.*"
      },
      {
        h6: "*The solutions in each language code file associated with this kata are my solutions unless otherwise noted in the code file.  Test cases are most often verbatim of those provided by the Kata.  However, in some cases it has been necessary to modify the test cases in order to have them function with my test runners and in my local environment.  On occasion, I may have added additional test cases to those provided.  Also, though I can't recall an instance, there may potentially have been reason to remove test cases for functional reasons.  Some Kata's also require (*or have*) code preloaded for their operation.  This code is included if it was required to make the tests work.  It is clearly identified under a **PRELOAD CODE** header if included.*"
      },
      {
        h6: "Most of my solutions are not commented (*though this will hopefully change*) as solutions are rarely submitted with comments on [Codewars.com](https://www.codewars.com).*"
      }
    ])
  } catch (error) {
    console.error(`Error from parseForMD(...) in ${path.basename(__filename)}`)
    throw Error(`Error parsing markdown for ${kataDetails?.name}\n${error}`)
  }
}
