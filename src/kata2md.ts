import getKataDetails from "./getKataDetails"
import getUserCompletedList from "./getUserCompletedList"
import getUserSolutionsList from "./getUserSolutionsList"
import { combineData, runLanguageWrites } from "./helpers"
import { parseForMD } from "./parseForMD"
import processCodeStrings from "./processCodeStrings"
import { createKataRootDir, writeKataMarkdownFile } from "./writeToFile"

/**
 * Main kata2markdown App
 */
export default async function k2m() {
  const { filteredUserCompletedList, fuclLength } = await getUserCompletedList()
  // getUserSolutionsList is not awaited here as it can be awaited later when used.
  const userSolutionsList = await getUserSolutionsList(filteredUserCompletedList, fuclLength)
  for (const kata of filteredUserCompletedList) {
    const extendedKataDetails = await getKataDetails(kata)
    await createKataRootDir(extendedKataDetails)
    const mdString = parseForMD(extendedKataDetails)
    /*
      Don't await the writing of the markdown file, nothing else depends on it having been written.
      Awaits for directory paths are handled in the mkdir calls & if there's an error, it will be caught and logged.
      mdString is awaited here, so writeKataMarkdownFile can be added to microtask queue and await mdString 
      without blocking the event loop.
    */
    writeKataMarkdownFile(extendedKataDetails, await mdString)
    for (const language of extendedKataDetails.completedLanguages) {
      const combinedKataData = combineData(extendedKataDetails, userSolutionsList, language)
      const combinedKataDataProcessed = processCodeStrings(await combinedKataData)
      /*
        Don't await the writing of kata files, nothing else depends on these files having been written.
        Awaits for directory paths are handled in the mkdir calls & if there's an error, it will be caught and logged.
        Same as above, combinedKataDataProcessed is awaited here, so runCodeWrites can be added to microtask queue
        and await combinedKataDataProcessed without blocking the event loop.
      */
      runLanguageWrites(await combinedKataDataProcessed)
    }
  }
  process.exitCode = 0
}
