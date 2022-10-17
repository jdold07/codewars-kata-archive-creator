/* eslint-disable @typescript-eslint/no-explicit-any */
import getUserCompletedList from "./getUserCompletedList"
import getKataDetails from "./getKataDetails"
import axios from "axios"
import axiosThrottle from "axios-request-throttle"
import * as Writes from "./writeToFile"
import parseForMD from "./parseForMD"
import getUserSolutionsList from "./getUserSolutionsList"
import { combineData, runCodeWrites } from "./helpers"
import processCodeStrings from "./processCodeStrings"

// Axios request throttling to prevent too many requests error from codewars.com on large imports
// ?Not sure this has any effect now (here) because all axios calls have been separated out to components
axiosThrottle.use(axios, { requestsPerSecond: 5 })

// Main app
export default async () => {
  async function runMainFlow(): Promise<boolean> {
    try {
      const filteredUserCompletedList = await getUserCompletedList()
      const userSolutionsList = await getUserSolutionsList()
      for (const kata of filteredUserCompletedList) {
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
    } catch (error) {
      if (error) {
        throw error
      }
    }
    return true
  }
  if ((await runMainFlow()) === true) {
    console.log(
      "Processing COMPLETE!  Check output path to confirm everything has completed as expected."
    )
    process.exitCode = 0
  } else {
    console.error(`Error while processing ... review config and try again`)
    process.exitCode = 1
  }
}
