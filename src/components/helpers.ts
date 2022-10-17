/* eslint-disable @typescript-eslint/no-explicit-any */
import { getKataTest } from "./getKataTest"
import * as config from "../../config/config"
import * as Writes from "./writeToFile"
import _ from "lodash"
import path from "node:path"

/**Helper function for filename case adjustments
 * Converts html slug name to language specific casing by convention
 * @param {slug: string} - Kata name in slug format (eg this-kata-name)
 * @param {flag: string} - Identifier for case type ("c", "s", default="no")
 * @returns {string} - Kata slug reformatted to language specific case convention
 **/
export function changeCase(slug: string, flag = "c"): string {
  return flag === "c"
    ? slug.replace(
        /-(\w)/g,
        (_: string, $1: string) => `${$1.slice(0, 1).toUpperCase()}${$1.slice(1)}`
      )
    : slug.replace(/-/g, "_")
}

/**
 * Match user solution/s & test data to the currently processing Kata & write to files
 * @Step_1 - Create a loop to cycle all languages in filteredKataDetails.completedLanguages
 * @Step_2 - For each completed language:
 *    @Step_2a - Find user solution for current ID & language & call code fileWrite method
 *    @Step_2b - Make web-scrape request for current ID & language test code from codewars.com
 *    @Step_2c - Make call to fileWrite method for kata test code
 * @param {kataDetails: any}
 * @param {userSolutionsList: any}
 * @param {language: string}
 * @returns {kataDetails: any} - Merged input kataDetails with current language, code & tests
 */
export async function combineData(
  kataDetails: any,
  userSolutionsList: any,
  language: string
): Promise<any> {
  const index = await userSolutionsList.findIndex(
    (el: any) => el.id === kataDetails.id && el.language === language
  )
  const languageSolution = (await userSolutionsList[index]?.code) || ""
  const languageTest = await getKataTest(kataDetails.id, language)
  return await Object.assign(_.cloneDeep(kataDetails), {
    curLang: language,
    code: languageSolution,
    tests: languageTest
  })
}

/**
 * Generate final variables required for directory creation for the
 * specific language version of the current Kata.  Then make the calls to
 * create necessary directory structure and write both code & test files
 * @param {kataData: any}
 * @returns {void}
 */
export function runCodeWrites(kataData: any): void {
  // Set language path
  const langPath = path.join(kataData.kataPath, kataData.curLang)
  // Set language file extension
  const langExt = config.myLanguages.get(kataData.curLang)?.extension || kataData.curLang
  // Set filename case type
  const langFilename =
    kataData.curLang === "python" ? changeCase(kataData.slug, "s") : changeCase(kataData.slug, "c")
  Writes.createLangDir(kataData, langPath)
  Writes.writeUserSolutionFile(kataData, langPath, langFilename, langExt)
  Writes.writeTestFile(kataData, langPath, langFilename, langExt)
  return
}
