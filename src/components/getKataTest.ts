/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios"
import cheerio from "cheerio"
import path from "path"
import { format } from "prettier"
import * as config from "../../private/config/config"

export async function getKataTest(id: string, language: string): Promise<string> {
  /** Fetch test code from Codewars.com language specific kata solutions page.
   * Process web-scrape for test code, format with Prettier (for JS & TS)
   * @Return const kataTest<string> (Test Code Block as string for file write process)
   **/
  try {
    const response = await axios.get(`https://www.codewars.com/kata/${id}/solutions/${language}`, {
      headers: { Cookie: config.sessionID }
    })
    const $ = cheerio.load(response.data)
    const parser = language === "javascript" ? "espree" : language === "typescript" ? "typescript" : undefined
    const kataTest = parser
      ? format($("#kata-details-description", response.data).siblings().find("code").text(), {
          semi: false,
          printWidth: 125,
          trailingComma: "none",
          parser: parser
        })
      : $("#kata-details-description", response.data).siblings().find("code").text()

    console.log(`Processing of TEST data for ${id} ${language} successful.`)
    return kataTest
  } catch (error) {
    console.error(`Error from getKataTest(...) in ${path.basename(__filename)}`)
    throw Error(`Error processing kata TEST data\n${error}`)
  }
}
