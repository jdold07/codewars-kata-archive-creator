import cheerio from "cheerio"
import { format } from "prettier"
import { launch } from "puppeteer"
import { sessionID } from "./config/config.js"

/**
 * Fetch test code from Codewars.com language specific kata solutions page.
 * Process web-scrape for test code, format with Prettier (for JS & TS)
 * @param {string} id - Kata ID
 * @param {string} language - Current language being processed
 * @returns {Promise<string>} - Test Code Block as string for file write process
 */
export async function getKataTest(id: string, language: string): Promise<string> {
  try {
    const browser = await launch({
      headless: true,
      defaultViewport: null,
      args: ["--window-size=1200,1000"],
    })
    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ cookie: sessionID })
    await page.goto(`https://www.codewars.com/kata/${id}/solutions/${language}`)
    await page.waitForSelector("#kata-details-description")
    const response = await page.evaluate(() => document.documentElement.innerHTML)
    await browser.close()

    const cheerioParse = cheerio.load(response)
    const parser = language === "javascript" ? "espree" : language === "typescript" ? "typescript" : undefined
    const kataTest = parser
      ? format(cheerioParse("#kata-details-description", response).siblings().find("code").text(), {
          semi: false,
          printWidth: 125,
          trailingComma: "none",
          parser: parser,
        })
      : cheerioParse("#kata-details-description", response).siblings().find("code").text()

    return kataTest
  } catch (error) {
    console.error(`Error from getKataTest(...)`)
    throw error
  }
}
