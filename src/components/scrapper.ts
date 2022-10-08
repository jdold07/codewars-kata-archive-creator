import cheerio from "cheerio"
import fs from "node:fs"
import { convert } from "html-to-text"
import { join } from "node:path"

export function scrapeHTML() {
  const html = "/Users/jdold07/Dropbox/Code/jdold07/kata2markdown/private/assets/mySolutions.html"
  const data: string = readHTML()
  const solutionData: {
    id: string | undefined
    url: string | undefined
    language: string | undefined
    code: string | undefined
  }[] = []

  function readHTML(): string {
    try {
      const fileData = fs.readFileSync(join(html), "utf8")
      return fileData
    } catch (err) {
      console.error("Error Reading File", err)
      throw new Error("File Reading Failed")
    }
  }

  try {
    const $ = cheerio.load(data)

    $(".list-item-solutions", data).each((_, elLi) => {
      const id = $(elLi).find("a").attr("href")?.split("/")[2]
      const url = "https://www.codewars.com" + $(elLi).find("a").attr("href")
      $("code", elLi).each((_, elCode) => {
        const language = $(elCode).attr("data-language")
        //TODO - Didn't need conversions when scrapping directly on Codewars.com - Test if I can do this with .text() instead of .html() and html-to-text conversion
        const code = convert($(elCode).html() || "", {
          preserveNewlines: true,
          wordwrap: false,
          whitespaceCharacters: "" // Added to remove default & maintain whitespace in code
        })

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

export default scrapeHTML
