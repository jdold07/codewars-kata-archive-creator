/* eslint-disable @typescript-eslint/no-explicit-any */
import cheerio from "cheerio"
import { format } from "prettier"
import Axios from "axios"
import * as config from "../../private/config/config"
import path from "node:path"

const userSolutionsList: {
  id: string | undefined
  language: string | undefined
  code: string | undefined
}[] = []

async function getUserSolutionsList(): Promise<any> {
  /** Fetch completed solutions from codewars.com/users/profile/completed_solutions
   * from within the user profile section on codewars.com
   **/
  try {
    const response = await Axios.get(`https://www.codewars.com/users/${config.userID}/completed_solutions`, {
      headers: { Cookie: config.sessionID }
    })
    return response.data
  } catch (error) {
    console.error(`Error from getCompletedSolutions() in ${path.basename(__filename)}`)
    throw Error(`Error accessing ${config.userID} solutions\n${error}`)
  }
}

export default async function processUserSolutions(): Promise<
  { id: string | undefined; language: string | undefined; code: string | undefined }[]
> {
  /** Extract language specific solutions code from user profile section,
   * format the web-scrapped code blocks (currently only for JS & TS with Prettier),
   * then push to a solutions array to be accessed in the file write process.
   **/
  const data: string = await getUserSolutionsList()
  try {
    const $ = cheerio.load(data)
    $(".list-item-solutions", data).each((_, listItemSolutions) => {
      const id = $(listItemSolutions).find("a").attr("href")?.split("/")[2]
      $("code", listItemSolutions).each((_, codeTag) => {
        const language = $(codeTag).attr("data-language")
        const myParser = language === "javascript" ? "espree" : language === "typescript" ? "typescript" : undefined
        const code = myParser
          ? format($(codeTag).text(), { semi: false, printWidth: 125, trailingComma: "none", parser: myParser })
          : $(codeTag).text()
        if (!userSolutionsList.find((existSolutions) => existSolutions.id === id && existSolutions.language === language)) {
          userSolutionsList.push({
            id: id,
            language: language,
            code: code
          })
        } else {
          console.log(`NOTE: More than one user solution found for ${id} in ${language}`)
          const index = userSolutionsList.findIndex(
            (existSolutions) => existSolutions.id === id && existSolutions.language === language
          )
          userSolutionsList[index].code += `${
            language === "python" || language === "coffeescript"
              ? `\n\n#+ ${"=".repeat(117)}\n#+ ${"=".repeat(117)}\n\n${code}\n\n`
              : `\n\n//+ ${"=".repeat(116)}\n//+ ${"=".repeat(116)}\n\n${code}\n\n`
          }`
        }
      })
    })
  } catch (error) {
    console.error(`Error from formatAndMergeSolutionData() in ${path.basename(__filename)}`)
    throw new Error(`Error formatting user solutions\n${error}`)
  }
  console.log(
    `Parsed and processed ${userSolutionsList.length} user solution code file${userSolutionsList.length > 1 ? "s" : ""}.`
  )
  return userSolutionsList
}
