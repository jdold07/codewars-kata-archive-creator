/* eslint-disable @typescript-eslint/no-explicit-any */
import getKataDetails from "./getKataDetails"
import getUserCompletedList from "./getUserCompletedList"
import getUserSolutionsList from "./getUserSolutionsList"
import { combineData, runCodeWrites } from "./helpers"
import parseForMD from "./parseForMD"
import processCodeStrings from "./processCodeStrings"
import * as Writes from "./writeToFile"

/**
 * Main kata2markdown App
 */
export default async () => {
  const filteredUserCompletedList = await getUserCompletedList()
  const userSolutionsList = await getUserSolutionsList()
  for (const kata of filteredUserCompletedList) {
    const kataDetailWithRankPath = await getKataDetails(kata)
    //TODO Make the kata root directory creation & markdown write only run once per Kata ID.
    //TODO At the moment this runs unnecessarily for every language a Kata has been completed in.
    await Writes.createKataRootDir(kataDetailWithRankPath)
    const mdString = await parseForMD(kataDetailWithRankPath)
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
