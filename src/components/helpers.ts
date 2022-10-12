/* eslint-disable @typescript-eslint/no-explicit-any */
import { getKataTest } from "./getKataTest"
import processCodeBlockStrings from "./processCodeBlockStrings"
import * as _ from "lodash"

export function changeCase(slug: string, flag = "no"): string {
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

export async function combineData(kataDetails: any, solutionsCode: any): Promise<void> {
  /** Match user solution/s & test data to the currently processing Kata & write to files
   * @Step 1 - Create a loop to cycle all languages in filteredKataDetails.completedLanguages
   * @Step 2 - For each completed language:
   *  @Step 2a - Find user solution for current ID & language & call code fileWrite method
   *  @Step 2b - Make web-scrape request for current ID & language test code from codewars.com
   *  @Step 2c - Make call to fileWrite method for kata test code
   **/
  for (const language of kataDetails.completedLanguages) {
    const index = await solutionsCode.findIndex((el: any) => el.id === kataDetails.id && el.language === language)
    const languageSolution = (await solutionsCode[index]?.code) || ""
    const languageTest = await getKataTest(kataDetails.id, language)
    processCodeBlockStrings(
      await Object.assign(_.cloneDeep(kataDetails), { curLang: language, code: languageSolution, tests: languageTest })
    )
  }
}
