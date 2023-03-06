/* eslint-disable @typescript-eslint/no-explicit-any */
import Axios from "axios"
import cheerio from "cheerio"
import { format } from "prettier"
import { Page, launch } from "puppeteer"
import readline from "readline"
import * as config from "../../config/config"
import userCompletedDB from "/Users/jdold07/Library/CloudStorage/Dropbox/code/projects/kata2markdown/config/userCompletedDB.json"

//+ ====================================================================================================================
//+ Main Default Function for collecting & processing user solutions
//+ ====================================================================================================================

/**
 * Extract language specific solutions code from user profile section,
 * format the web-scrapped code blocks (currently only for JS & TS with Prettier),
 * then push to a solutions array to be accessed in the file write process.
 * @returns {userSolutionsList: Promise<any>} - Processed userSolutionsList
 */
export default async function getUserSolutionsList(): Promise<
  { id: string | undefined; language: string | undefined; code: string | undefined }[]
> {
  const data: string = config.entireSolutionsList
    ? await getUserSolutionsAllPages()
    : await getUserSolutionsFirstPage()
  const userSolutionsList: {
    id: string | undefined
    language: string | undefined
    code: string | undefined
  }[] = []
  let multipleSolutionsCount = 0

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
          multipleSolutionsCount += 1
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
    `Parsed and processed ${userSolutionsList.length} user solution${
      userSolutionsList.length > 1 ? "s" : ""
    }.\n${multipleSolutionsCount} Katas have multiple solutions in a given language.`
  )
  return userSolutionsList
}

//+ ====================================================================================================================
//+ AXIOS Solution Section for getting first page ONLY of user solutions
//+ ====================================================================================================================

/**
 * Fetch completed solutions from codewars.com/users/profile/completed_solutions
 * from within the user profile section on codewars.com
 * @returns {response.data: Promise<any>} - html of user solutions scrapped from user profile
 */
async function getUserSolutionsFirstPage(): Promise<any> {
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

/**
 * Fetch entire completed solutions list from codewars.com/users/profile/completed_solutions
 * from within the user profile section on codewars.com using puppeteer module.
 * @returns {userSolutionsList.html: Promise<any>} - html of user solutions scrapped from user profile
 */
async function getUserSolutionsAllPages() {
  try {
    const browser = await launch({
      headless: true,
      defaultViewport: null,
      args: ["--window-size=1200,800"]
    })
    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ cookie: config.sessionID })
    await page.goto(`https://www.codewars.com/users/${config.userID}/completed_solutions`)
    const delay = 2000
    const totalKatas = userCompletedDB.length
    let pageCount = 0
    let loadedCount = 0
    const progress = () => Math.round((loadedCount / totalKatas) * 100)
    const logMessage = () =>
      `${loadedCount} Katas from ${++pageCount} pages.  ${progress()}% complete...`
    do {
      loadedCount = await getCount(page)
      await showProgress(await logMessage())
      await scrollDown(page)
      await new Promise((res) => setTimeout(res, delay))
    } while (totalKatas > loadedCount)
    console.log(await logMessage())
    await new Promise((res) => setTimeout(res, delay))
    const userSolutionsList = await page.evaluate(() => {
      return { html: document.documentElement.innerHTML }
    })
    await browser.close()
    return await userSolutionsList.html
  } catch (error) {
    console.error(`Error from getUserSolutionsAllPages() for ${config.userID} PUPPETEER solutions`)
    throw error
  }
}

/**
 * Helper function for getEntireUserSolutionsList().  Returns array length for
 * comparison against previous to evaluate end of infinite scroll
 * @param {page: Page} - Current evaluated page from puppeteer
 * @returns {Promise<number>} - Length of the array of selector param of page.$$eval
 */
async function getCount(page: Page): Promise<number> {
  return await page.$$eval(".list-item-solutions", (arr) => arr.length)
}

/**
 * Helper function for getEntireUserSolutionList() relating to progress logging.
 * Function is to clear line on stdout and write updated progress message.
 * @param {message: string} - The updated message to log out
 * @returns {void}
 */
function showProgress(message: string): void {
  process.stdout.write(message)
  readline.cursorTo(process.stdout, 0)
  return
}

/**
 * Helper function for getEntireUserSolutionsList().  Runs the page scroll to bring
 * selector param into view and trigger infinite scroll next page.
 * @param {page: Page} - Current evaluated page from puppeteer
 */
async function scrollDown(page: Page) {
  await page.$eval(".items-list:last-child", (selector) => {
    selector.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" })
  })
}
