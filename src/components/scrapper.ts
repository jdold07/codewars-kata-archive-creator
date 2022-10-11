import cheerio from "cheerio"
import { format } from "prettier"
import Axios from "axios"
import * as config from "../../private/components/config"
// import fs from "node:fs"
// import { join } from "node:path"
// import { convert } from "html-to-text"

export async function scrapeHTML() {
  // const html = solutionPath
  const data: string = await getHTML()
  const solutionData: {
    id: string | undefined
    url: string | undefined
    language: string | undefined
    code: string | undefined
  }[] = []

  // Original setup for reading html from manually downloaded local file copy
  // function readHTML(): string {
  //   try {
  //     const fileData = fs.readFileSync(join(html), "utf8")
  //     return fileData
  //   } catch (err) {
  //     console.error("Error Reading File", err)
  //     throw new Error("File Reading Failed")
  //   }
  // }

  // Same step as for readHTML, but for fetching html content directly from codewars.com
  async function getHTML() {
    try {
      const response = await Axios.get(`https://www.codewars.com/users/${config.userID}/completed_solutions`, {
        headers: { Cookie: config.sessionID }
      })
      return response.data
    } catch (err) {
      console.warn(`Error collecting solutions from codewars.com: ${err}`)
      throw Error(`Cannot access solutions data: ${err}`)
    }
  }

  try {
    const $ = cheerio.load(data)

    $(".list-item-solutions", data).each((_, elLi) => {
      const id = $(elLi).find("a").attr("href")?.split("/")[2]
      const url = "https://www.codewars.com" + $(elLi).find("a").attr("href")
      $("code", elLi).each((_, elCode) => {
        const language = $(elCode).attr("data-language")
        const parser = language === "javascript" ? "espree" : language === "typescript" ? "typescript" : undefined
        const code = parser
          ? format($(elCode).text(), { semi: false, printWidth: 125, trailingComma: "none", parser: parser })
          : $(elCode).text()

        //TODO - Didn't need conversions when scrapping directly on Codewars.com - Test if I can do this with .text() instead of .html() and html-to-text conversion
        // const code = convert($(elCode).html() || "", {  //! Swapping this out for straight text from cheerio with prettier-format
        //   preserveNewlines: true,
        //   wordwrap: false,
        //   whitespaceCharacters: "" // Added to remove default & maintain whitespace in code
        // })

        if (!solutionData.find((v) => v.id === id && v.language === language)) {
          solutionData.push({
            id: id,
            url: url,
            language: language,
            code: code
          })
        } else {
          console.warn(`Alternate code solution found for ${id} ${language}`)
          const index = solutionData.findIndex((v) => v.id === id && v.language === language)
          solutionData[index].code =
            solutionData[index].code +
            `${
              language === "python" || language === "coffeescript"
                ? `\n\n# ${"=".repeat(118)}\n# ${"=".repeat(118)}\n\n${code}\n\n`
                : `\n\n// ${"=".repeat(117)}\n// ${"=".repeat(117)}\n\n${code}\n\n`
            }`
        }
      })
    })
  } catch (err) {
    console.error("Error parsing CODE solution data", err)
    throw new Error(`Error parsing CODE solution data (${err})`)
  }
  console.log("Solutions conversion from html to array of objects completed.")
  return solutionData
}
