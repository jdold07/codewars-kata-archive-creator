import { join } from "node:path"
import { myLanguages } from "./config/config.js"
import { getKataTest } from "./getKataTest.js"
import { CombinedKataDetail, ExtendedKataDetails, UserSolution } from "./types.js"
import { createLangDir, writeTestFile, writeUserSolutionFile } from "./writeToFile.js"

/**Helper function for filename case adjustments
 * Converts html slug name to language convention specific casing
 * @param {string} slug - Kata name in slug format (eg this-kata-name)
 * @param {string} [caseFlag="c"] - Identifier for case type ("c", "s", "p", default="c")
 * @returns {string} - Kata slug reformatted to language specific case convention
 **/
export function changeSlugCase(slug: string, caseFlag = "c"): string {
  return caseFlag === "c"
    ? slug.replace(/-(\w)/g, (_: string, $1: string) => `${$1.slice(0, 1).toUpperCase()}${$1.slice(1)}`)
    : caseFlag === "p"
    ? slug.replace(/(^\w|-\w)/g, (_: string, $1: string) => `${$1.slice(0, 1).toUpperCase()}${$1.slice(1)}`).replace(/-/g, "")
    : slug.replace(/-/g, "_")
}

/**
 * Match user solution/s & test data to the currently processing Kata & generate combined kata details object
 * 1. Find the index of the current Kata in the userSolutionsList
 * 2. If found, get the code for the current language from the userSolutionsList:
 *    - Find user solution for the kata ID & language
 *    - Make web-scrape request for kata ID & language test code from codewars kata solutions page
 *    - Return the combined kata details object with the current language, code & tests
 * @param {ExtendedKataDetails} extendedKataDetails - Extended kata details object
 * @param {UserSolution[]} userSolutionsList - User solutions object array
 * @param {string} language - Current language being processed
 * @returns {CombinedKataDetail} - Merged input kataDetails with current language, code & tests
 */
export async function combineData(
  extendedKataDetails: ExtendedKataDetails,
  userSolutionsList: UserSolution[],
  language: string,
): Promise<CombinedKataDetail> {
  const index = userSolutionsList.findIndex(
    (userSolution) => userSolution.id === extendedKataDetails.id && userSolution.language === language,
  )
  const languageSolution = userSolutionsList[index]?.code || ""
  const languageTest = await getKataTest(extendedKataDetails.id, language)
  return { ...extendedKataDetails, curLang: language, code: languageSolution, tests: languageTest }
}

/**
 * Generate final variables required for directory creation for the
 * specific language version of the current Kata.  Then make the calls to
 * create necessary directory structure and write both code & test files
 * @param {CombinedKataDetail} formattedCombinedKataDetail - Processed and formatted combined kata detail object
 * @returns {Promise<void>}
 */
export async function runLanguageWrites(formattedCombinedKataDetail: CombinedKataDetail): Promise<void> {
  // Set language path
  const langPath = join(formattedCombinedKataDetail.kataPath, formattedCombinedKataDetail.curLang)
  const mkdir = createLangDir(formattedCombinedKataDetail, langPath)
  // Set filename case type
  const langFilename =
    formattedCombinedKataDetail.curLang === "python"
      ? changeSlugCase(formattedCombinedKataDetail.slug, "s")
      : changeSlugCase(formattedCombinedKataDetail.slug, "c")
  // Set language file extension
  const langExt = myLanguages.get(formattedCombinedKataDetail.curLang)?.extension || formattedCombinedKataDetail.curLang

  // Awaited as path is required for the file to be written - Testing if I can call the function early and await it later.
  await mkdir
  // Intentionally not awaited.  App can continue as the written file is never referenced.
  writeUserSolutionFile(formattedCombinedKataDetail, langPath, langFilename, langExt)
  writeTestFile(formattedCombinedKataDetail, langPath, langFilename, langExt)
  return
}
