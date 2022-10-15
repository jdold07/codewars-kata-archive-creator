/* eslint-disable @typescript-eslint/no-explicit-any */
import getUserCompletedList from "./getUserCompletedList"
import getKataDetails from "./getKataDetails"
import axios from "axios"
import axiosThrottle from "axios-request-throttle"
import * as Writes from "./writeToFile"
import parseForMD from "./parseForMD"
import processUserSolutions from "./getUserSolutionsList"
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
      const userSolutionsList = await processUserSolutions()
      for (const kata of filteredUserCompletedList) {
        const kataDetailWithRankPath = await getKataDetails(kata)
        //TODO Make the kata root directory creation & markdown write only run once per Kata ID.
        //TODO At the moment this runs unnecessarily for every language a Kata has been completed in.
        Writes.createKataRootDir(kataDetailWithRankPath)
        const mdString = parseForMD(kataDetailWithRankPath)
        Writes.writeKataMarkdownFile(kataDetailWithRankPath, mdString)
        for await (const language of kataDetailWithRankPath.completedLanguages) {
          const combinedKataData = await combineData(kataDetailWithRankPath, userSolutionsList, language)
          const kataDataProcessedCode = processCodeStrings(combinedKataData)
          runCodeWrites(kataDataProcessedCode)
        }
      }
    } catch (error) {
      if (error) {
        console.error(`Error executing kata2markdown App ... review config and try again`)
        throw Error(`An error occurred while executing kata2markdown App\n${error}`)
      }
    }
    return true
  }
  if ((await runMainFlow()) === true) {
    console.log("Processing COMPLETE!  Check output path to confirm everything has completed as expected.")
    process.exitCode = 0
  } else {
    console.error(`Error while processing ... review config and try again`)
    process.exitCode = 1
  }
}
