import json2md from "json2md"
import { ExtendedKataDetails } from "./types.js"

/** json2md mapping / layout to generate markdown file content
 * @param {ExtendedKataDetails} extendedKataDetails - Data object containing Kata detail required for description
 * @returns {json2md: string} - Data object parsed into markdown layout as a string
 **/
export async function parseForMD(extendedKataDetails: ExtendedKataDetails): Promise<string> {
  try {
    const date = new Date().toISOString().split("T")[0]

    return json2md([
      { h1: `${extendedKataDetails?.rank?.name || "BETA"} - ${extendedKataDetails?.name}` },
      {
        h5: `**ID**: [${extendedKataDetails?.id || "*not available*"}](${extendedKataDetails?.url}) | **Slug**: [${
          extendedKataDetails?.slug || "*not available*"
        }](${extendedKataDetails?.url}) | **Category**: \`${
          extendedKataDetails?.category?.toUpperCase() || "NONE"
        }\` | **Rank**: <span style="color:${extendedKataDetails?.rank?.color || "grey"}">${
          extendedKataDetails?.rank?.name || "*BETA*"
        }</span>`,
      },
      {
        h5: `**First Published**: ${extendedKataDetails?.publishedAt?.split("T")[0] || "*not available*"} ***by*** [${
          extendedKataDetails?.createdBy?.username || "*not available*"
        }](${extendedKataDetails?.createdBy?.url || "https://www.codewars.com"}) | **Approved**: ${
          extendedKataDetails?.approvedAt?.split("T")[0] || "*not available*"
        } ***by*** [${extendedKataDetails?.approvedBy?.username || "*not available*"}](${
          extendedKataDetails?.approvedBy?.url || "*https://www.codewars.com*"
        })`,
      },
      { h5: `**Languages Available**: ${extendedKataDetails?.languages?.join(", ") || "*not available*"}` },
      {
        h5: `**My Completed Languages**: ${
          extendedKataDetails?.completedLanguages?.join(", ") || "*not available*"
        } ***as at*** ${date} | **Originally completed**: ${
          extendedKataDetails?.completedAt?.split("T")[0] || "*not available*"
        }`,
      },
      { hr: "" },
      { h2: "Kata Description" },
      {
        p:
          extendedKataDetails?.description ||
          `# Ooops ... Description not available\n### Description was not available for [${extendedKataDetails?.id}](${extendedKataDetails?.url}) at the time of markdown generation.`,
      },
      { hr: "" },
      { p: `🏷 \`${extendedKataDetails?.tags?.join(" | ").toUpperCase() || "NONE"}\`` },
      { p: `[View this Kata on Codewars.com](${extendedKataDetails?.url || "https://www.codewars.com"})` },
      {
        img: {
          title: "tsdevau Codewars Badge",
          source: "https://www.codewars.com/users/jdold07/badges/large",
        },
      },
      { hr: "" },
      {
        h6: "*This Kata description was compiled by [**tsdevau**](https://tsdev.au) with data provided by the [Codewars.com](https://www.codewars.com) API.*",
      },
      {
        h6: "*The solutions in each language code file associated with this kata are my solutions unless otherwise noted in the code file.  Test cases are most often verbatim of those provided by the Kata.  However, in some cases it has been necessary to modify the test cases in order to have them function with my test runners and in my local environment.  On occasion, I may have added additional test cases to those provided.  Also, though I can't recall an instance, there may potentially have been reason to remove test cases for functional reasons.  Some Kata's also require (*or have*) code preloaded for their operation.  This code is included if it was required to make the tests work.  It is clearly identified under a **PRELOAD CODE** header if included.*",
      },
      {
        h6: "Most of my solutions are not commented (*though this will hopefully change*) as solutions are rarely submitted with comments on [Codewars.com](https://www.codewars.com).*",
      },
    ])
  } catch (error) {
    console.error(`Error from parseForMD(...) for ${extendedKataDetails?.name}`)
    throw error
  }
}
