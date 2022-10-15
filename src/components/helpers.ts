/* eslint-disable @typescript-eslint/no-explicit-any */
import { getKataTest } from "./getKataTest"
import * as config from "../../config/config"
import * as Writes from "./writeToFile"
import _ from "lodash"
import path from "node:path"

export function changeCase(slug: string, flag = "c"): string {
  /**Helper function for filename case adjustments
   * Converts html slug name to language specific casing by convention
   * @Param slug <string> Kata name in slug format (eg this-kata-name)
   * @Param flag <string> Identifier for case type ("c", "s", default="no")
   * @Return => <string> Kata slug reformatted to language specific case convention
   **/
  return flag === "c"
    ? slug.replace(/-(\w)/g, (_: string, $1: string) => `${$1.slice(0, 1).toUpperCase()}${$1.slice(1)}`)
    : slug.replace(/-/g, "_")
}

export async function combineData(kataDetails: any, userSolutionsList: any, language: string): Promise<any> {
  /** Match user solution/s & test data to the currently processing Kata & write to files
   * @Step 1 - Create a loop to cycle all languages in filteredKataDetails.completedLanguages
   * @Step 2 - For each completed language:
   *  @Step 2a - Find user solution for current ID & language & call code fileWrite method
   *  @Step 2b - Make web-scrape request for current ID & language test code from codewars.com
   *  @Step 2c - Make call to fileWrite method for kata test code
   **/
  const index = await userSolutionsList.findIndex((el: any) => el.id === kataDetails.id && el.language === language)
  const languageSolution = (await userSolutionsList[index]?.code) || ""
  const languageTest = await getKataTest(kataDetails.id, language)
  return await Object.assign(_.cloneDeep(kataDetails), { curLang: language, code: languageSolution, tests: languageTest })
}

export function runCodeWrites(kataData: any): void {
  /** Generate final variables required for directory creation for the
   * specific language version of the current Kata.  Then make the calls to
   * create necessary directory structure and write both code & test files
   */
  // Set language path
  const langPath = path.join(kataData.kataPath, kataData.curLang)
  // Set language file extension
  const langExt = config.myLanguages.get(kataData.curLang)?.extension || kataData.curLang
  // Set filename case type
  const langFilename = kataData.curLang === "python" ? changeCase(kataData.slug, "s") : changeCase(kataData.slug, "c")
  Writes.createLangDir(kataData, langPath)
  Writes.writeUserSolutionFile(kataData, langPath, langFilename, langExt)
  Writes.writeTestFile(kataData, langPath, langFilename, langExt)
  return
}
