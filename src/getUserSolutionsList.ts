import cheerio from "cheerio"
import { format } from "prettier"
import { launch, type Page } from "puppeteer"
import readline from "readline"
import { getPages, sessionID, userID } from "./config/config"
import { ConfigGetPages, UserCompletedDBEntry, UserSolution } from "./types"

//+ ====================================================================================================================
//+ Main Default Function for collecting & processing user solutions
//+ ====================================================================================================================

/**
 * Extract language specific solutions code from user profile section,
 * format the web-scrapped code blocks (currently only for JS & TS with Prettier),
 * then push to a solutions array to be accessed in the file write process.
 * @param {Promise<UserCompletedDBEntry[]>} filteredUserCompletedList - Filtered list of completed Katas
 * @param {number} ucdbLength - Length of the full list of user completed Katas
 * @returns {Promise<UserSolution[]>} - Array of user solutions objects
 */
export default async function getUserSolutionsList(
  filteredUserCompletedList: UserCompletedDBEntry[],
  ucdbLength: number,
): Promise<UserSolution[]> {
  console.log("Web scraping user solutions from the user profile page...")
  const scrapedHtmlString: string = await getUserSolutions(getPages, ucdbLength)
  const userSolutionsList: UserSolution[] = []
  let kataCount = 0
  let solutionCount = 0

  console.log("Parsing user solutions scraped from the user profile page...")
  const cheerioParse = cheerio.load(scrapedHtmlString)
  const parsing = new Promise((resolve) =>
    resolve(
      cheerioParse(".list-item-solutions", scrapedHtmlString).each((_, listItemSolutions) => {
        kataCount++
        const id = cheerioParse(listItemSolutions).find("a").attr("href")?.split("/")[2]
        cheerioParse("code", listItemSolutions).each(async (_, codeTag) => {
          solutionCount++
          const language = cheerioParse(codeTag).attr("data-language")

          // If the kata is not in the filtered list, no need to format or include in solution list.
          if (!filteredUserCompletedList.find((kata) => kata.id === id)) {
            return
          }

          // If the kata is in the filtered list, continue on to format and include in solution list.
          const parser = language === "javascript" ? "espree" : language === "typescript" ? "typescript" : undefined
          const code = parser
            ? await format(cheerioParse(codeTag).text(), {
                semi: false,
                printWidth: 125,
                trailingComma: "es5",
                parser: parser,
              })
            : cheerioParse(codeTag).text()

          if (
            userSolutionsList.find((existSolutions) => existSolutions.id === id && existSolutions.language === language)
          ) {
            const index = userSolutionsList.findIndex(
              (existSolutions) => existSolutions.id === id && existSolutions.language === language,
            )
            userSolutionsList[index].code += `${
              language === "python" || language === "coffeescript"
                ? `\n\n#+ ${"=".repeat(117)}\n#+ ${"=".repeat(117)}\n\n${code}\n\n`
                : `\n\n//+ ${"=".repeat(116)}\n//+ ${"=".repeat(116)}\n\n${code}\n\n`
            }`
          } else {
            userSolutionsList.push({
              id: id,
              language: language,
              code: code,
            })
          }
          process.stdout.write(`\rProcessed ${solutionCount} solutions from ${kataCount} katas...`)
          return
        })
      }),
    ),
  ).catch((error) => {
    console.error(`Error from getUserSolutionsList()`)
    throw error
  })
  await parsing
  console.log("\n")
  return userSolutionsList
}

//+ ====================================================================================================================
//+ PUPPETEER Solution Section for collecting user solutions with flag to collect all pages
//+ ====================================================================================================================

/**
 * Fetch entire completed solutions list from codewars.com/users/profile/completed_solutions
 * from within the user profile section on codewars.com using puppeteer module.
 * @param {ConfigGetPages} [getPages=false] Flag to collect all pages of solutions or just the first page
 * @param {number} ucdbLength - Length of the full list of user completed Katas
 * @returns {Promise<string>} html of user solutions scrapped from user profile as a string
 */
async function getUserSolutions(getPages: ConfigGetPages = false, ucdbLength: number): Promise<string> {
  try {
    const browser = await launch({
      headless: "new",
      defaultViewport: null,
      args: ["--window-size=1200,1000"],
    })
    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ cookie: sessionID })
    await page.goto(`https://www.codewars.com/users/${userID}/completed_solutions`)
    await page.waitForSelector(".js-infinite-marker")
    const maxCount = ucdbLength
    const pagesAsCount = +getPages * 15 // Time of writing, infinate scroll returns 15 katas per page
    const totalKatas =
      typeof getPages === "boolean" ? (getPages ? maxCount : 0) : pagesAsCount < maxCount ? pagesAsCount : maxCount
    let pageCount = 0
    let loadedCount = 0

    do {
      loadedCount = await getCount(page)
      showProgress(logMessage(loadedCount, ++pageCount, totalKatas))
      await scrollDown(page)
    } while (totalKatas > loadedCount)

    const userSolutionsList = await page.evaluate(() => document.documentElement.innerHTML)
    await browser.close()
    return userSolutionsList
  } catch (error) {
    console.error(`Error from getUserSolutions() for ${userID} solutions`)
    throw error
  }
}

//+ ====================================================================================================================
//+ PUPPETEER Helper functions for counts, progress, page scrolling etc
//+ ====================================================================================================================

/**
 * Helper function for getEntireUserSolutionsList().  Returns array length for
 * comparison against previous to evaluate end of infinite scroll
 * @param {Page} page - Current evaluated page from puppeteer
 * @returns {Promise<number>} - Length of the array of selector param of page.$$eval
 */
async function getCount(page: Page): Promise<number> {
  return await page.$$eval(".list-item-solutions", (arr) => arr.length)
}

/**
 * Helper function for getEntireUserSolutionList() relating to progress logging.
 * Function is to clear line on stdout and write updated progress message.
 * @param {string} message - The updated message to log out
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
 * @param {Page} page - Current evaluated page from puppeteer
 */
async function scrollDown(page: Page) {
  await page.$eval(".js-infinite-marker", (selector) => {
    selector.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" })
  })
}

/**
 * Helper function to calculate progress percentage for logging.
 * @param {number} loadedCount - The current number of katas loaded
 * @param {number} totalKatas - The total number of katas to load
 * @returns {number} - The progress percentage as an integer
 */
function progress(loadedCount: number, totalKatas: number): number {
  return Math.round((loadedCount / totalKatas) * 100)
}

/**
 * Helper function to generate progress message for logging.
 *
 */
function logMessage(loadedCount: number, pageCount: number, totalKatas: number) {
  return `Read ${loadedCount} Katas from ${totalKatas ? pageCount : "first"} user solution page${
    totalKatas || pageCount !== 1 ? "s" : ""
  }.  ${totalKatas ? progress(loadedCount, totalKatas) : "100"}% complete...`
}
