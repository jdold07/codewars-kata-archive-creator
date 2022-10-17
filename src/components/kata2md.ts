/* eslint-disable @typescript-eslint/no-explicit-any */
import getUserCompletedList from "./getUserCompletedList"
import getKataDetails from "./getKataDetails"
import * as Writes from "./writeToFile"
import parseForMD from "./parseForMD"
import getUserSolutionsList from "./getUserSolutionsList"
import { combineData, runCodeWrites } from "./helpers"
import processCodeStrings from "./processCodeStrings"

/**
 * Main kata2markdown App
 */
export default async () => {
  const filteredUserCompletedList = await getUserCompletedList()
  const userSolutionsList = await getUserSolutionsList()
  for await (const kata of filteredUserCompletedList) {
    const kataDetailWithRankPath = await getKataDetails(kata)
    //TODO Make the kata root directory creation & markdown write only run once per Kata ID.
    //TODO At the moment this runs unnecessarily for every language a Kata has been completed in.
    await Writes.createKataRootDir(kataDetailWithRankPath)
    const mdString = parseForMD(kataDetailWithRankPath)
    await Writes.writeKataMarkdownFile(kataDetailWithRankPath, mdString)
    for await (const language of kataDetailWithRankPath.completedLanguages) {
      const combinedKataData = await combineData(
        kataDetailWithRankPath,
        userSolutionsList,
        language
      )
      const kataDataProcessedCode = await processCodeStrings(combinedKataData)
      await runCodeWrites(kataDataProcessedCode)
    }
  }
  console.log("Processing COMPLETE!  Check output to confirm everything has completed as expected.")
  process.exitCode = 0
}
