import cheerio from "cheerio"
import { format } from "prettier"
import Axios from "axios"
import * as config from "../../private/config/config"

const solutionCode: {
  id: string | undefined
  url: string | undefined
  language: string | undefined
  code: string | undefined
}[] = []

// Fetch completed solutions from codewars.com/users/profile/completed_solutions page
async function getCompletedSolutions() {
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

// Extract individual language solutions code, format code block & push to solutionData array
export async function formatAndMergeSolutionData() {
  const data: string = await getCompletedSolutions()
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

        if (!solutionCode.find((v) => v.id === id && v.language === language)) {
          solutionCode.push({
            id: id,
            url: url,
            language: language,
            code: code
          })
        } else {
          console.warn(`NOTE: More than one code solution found for ${id} ${language}`)
          const index = solutionCode.findIndex((v) => v.id === id && v.language === language)
          solutionCode[index].code =
            solutionCode[index].code +
            `${
              language === "python" || language === "coffeescript"
                ? `\n\n#+ ${"=".repeat(117)}\n# ${"=".repeat(117)}\n\n${code}\n\n`
                : `\n\n//+ ${"=".repeat(116)}\n// ${"=".repeat(116)}\n\n${code}\n\n`
            }`
        }
      })
    })
  } catch (err) {
    console.error("Error parsing CODE solution data", err)
    throw new Error(`Error parsing CODE solution data (${err})`)
  }
  console.log(`Kata Solution${solutionCode.length > 1 ? "s" : ""} h${solutionCode.length > 1 ? "ave" : "as"} been parsed`)
  return solutionCode
}
