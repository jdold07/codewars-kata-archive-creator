/* eslint-disable @typescript-eslint/no-explicit-any */
import cheerio from "cheerio"
import { format } from "prettier"
import Axios from "axios"
import * as config from "../../config/config"
import puppeteer from "puppeteer"

//+ ====================================================================================================================
//+ Main Default Function for collecting & processing user solutions
//+ ====================================================================================================================

export default async function getUserSolutionsList(): Promise<
  { id: string | undefined; language: string | undefined; code: string | undefined }[]
> {
  /**
   * Extract language specific solutions code from user profile section,
   * format the web-scrapped code blocks (currently only for JS & TS with Prettier),
   * then push to a solutions array to be accessed in the file write process.
   **/
  const data: string = config.entireSolutionsList
    ? await getUserSolutionsAllPages()
    : await getUserSolutionsFirstPage()
  const userSolutionsList: {
    id: string | undefined
    language: string | undefined
    code: string | undefined
  }[] = []

  try {
    const $ = cheerio.load(data)
    $(".list-item-solutions", data).each((_, listItemSolutions) => {
      const id = $(listItemSolutions).find("a").attr("href")?.split("/")[2]
      $("code", listItemSolutions).each((_, codeTag) => {
        const language = $(codeTag).attr("data-language")
        const myParser =
          language === "javascript"
            ? "espree"
            : language === "typescript"
            ? "typescript"
            : undefined
        const code = myParser
          ? format($(codeTag).text(), {
              semi: false,
              printWidth: 125,
              trailingComma: "none",
              parser: myParser
            })
          : $(codeTag).text()
        if (
          !userSolutionsList.find(
            (existSolutions) => existSolutions.id === id && existSolutions.language === language
          )
        ) {
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
    console.error(`Error from getUserSolutionsList()`)
    throw error
  }
  console.log(
    `Parsed and processed ${userSolutionsList.length} user solution code file${
      userSolutionsList.length > 1 ? "s" : ""
    }.`
  )
  return userSolutionsList
}

//+ ====================================================================================================================
//+ AXIOS Solution Section for getting first page ONLY of user solutions
//+ ====================================================================================================================

async function getUserSolutionsFirstPage(): Promise<any> {
  /**
   * Fetch completed solutions from codewars.com/users/profile/completed_solutions
   * from within the user profile section on codewars.com
   **/
  try {
    const response = await Axios.get(
      `https://www.codewars.com/users/${config.userID}/completed_solutions`,
      {
        headers: { Cookie: config.sessionID }
      }
    )
    return response.data
  } catch (error) {
    console.error(`Error from getUserSolutionsFirstPage() for ${config.userID} AXIOS solutions`)
    throw error
  }
}

//+ ====================================================================================================================
//+ PUPPETEER Solution Section for collecting ALL user solutions
//+ ====================================================================================================================

async function getUserSolutionsAllPages() {
  /**
   * Fetch entire completed solutions list from codewars.com/users/profile/completed_solutions
   * from within the user profile section on codewars.com using puppeteer module.
   **/
  try {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      args: ["--window-size=1200,800"]
    })
    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ cookie: config.sessionID })
    await page.goto(`https://www.codewars.com/users/${config.userID}/completed_solutions`)
    const delay = 3000
    let preCount = 0
    let postCount = 0
    do {
      preCount = await getCount(page)
      await scrollDown(page)
      await new Promise((res) => setTimeout(res, delay))
      postCount = await getCount(page)
    } while (postCount > preCount)
    await new Promise((res) => setTimeout(res, delay))
    const pageData = await page.evaluate(() => {
      return { html: document.documentElement.innerHTML }
    })
    await browser.close()
    return await pageData.html

    // Error Handling
  } catch (error) {
    console.error(`Error from getUserSolutionsAllPages() for ${config.userID} PUPPETEER solutions`)
    throw error
  }
}

async function getCount(page: puppeteer.Page): Promise<number> {
  /**
   * Helper function for getEntireUserSolutionsList().  Returns array length for
   * comparison against previous to evaluate end of infinite scroll
   * @param page {puppeteer.Page} Current evaluated page from puppeteer
   * @returns Promise<number> Length of the array of selector param of page.$$eval
   */
  return await page.$$eval(".list-item-solutions", (arr) => arr.length)
}

async function scrollDown(page: puppeteer.Page) {
  /**
   * Helper function for getEntireUserSolutionsList().  Runs the page scroll to bring
   * selector param into view and trigger infinite scroll next page.
   * @param page {puppeteer.Page} Current evaluated page from puppeteer
   */
  await page.$eval(".items-list:last-child", (selector) => {
    selector.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" })
  })
}
