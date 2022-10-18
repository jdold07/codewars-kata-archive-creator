/* eslint-disable @typescript-eslint/no-explicit-any */
import userCompletedDB from "/Users/jdold07/Dropbox/Code/jdold07/kata2markdown/config/userCompletedDB.json"
import { userID } from "../../config/config"
import { updateUserCompletedDB } from "./writeToFile"
import axios from "axios"

/**
 * Entry point for fetching new/current Completed Kata List from API
 * @Step_1 - Fetch current complete list of Completed Kata List from API
 * @Step_2 - Filter the collected list against existing completed Kata DB
 * @Step_3 - Write updates to existing completed Kata DB
 * @returns {filteredCompletedKataList:
 *    data: {
 *      id: string
 *      name: string
 *      slug: string
 *      completedLanguages: string[]
 *      completedAt: string
 *    }[]}
 */
export default async function getUserCompletedList(): Promise<any> {
  const fullUserCompletedList = await fetchUserCompletedList()
  const filteredCompletedKataList = filterUserCompletedList(fullUserCompletedList)
  await updateUserCompletedDB(fullUserCompletedList)
  return filteredCompletedKataList
}

/**
 * Fetch latest complete list of completed Katas
 * Used to assert which Katas need downloading of Kata Detail from API &
 * for completion date & completed languages info
 * @returns {fullUserCompletedList: Promise<any>}
 */
async function fetchUserCompletedList(): Promise<any> {
  try {
    let page = 0
    let response
    const fullUserCompletedList: any[] = []

    do {
      response = await axios.get(
        `http://www.codewars.com/api/v1/users/${userID}/code-challenges/completed?page=${page}`
      )
      fullUserCompletedList.push(...response.data.data)
      page += 1
    } while (page < response?.data?.totalPages || 0)
    return fullUserCompletedList
  } catch (error) {
    console.error(`Error from fetchUserCompletedList()`)
    throw error
  }
}

/**
 * Filters complete list of completed Katas against the existing completed Kata DB
 * Filtered list provides detail of any Kata that is required to be added or
 * any Kata that requires updating due to a new language completion.
 * The completed Kata list also contains completion information, specifically
 * the completion date and what languages the Kata has been completed in.
 * @param {fullCompletedKataList:
 *    data: {
 *      id: string
 *      name: string
 *      slug: string
 *      completedLanguages: string[]
 *      completedAt: string
 *    }[]}
 * @returns {filteredCompleteKataList:
 *    data: {
 *      id: string
 *      name: string
 *      slug: string
 *      completedLanguages: string[]
 *      completedAt: string
 *    }[]}
 **/
function filterUserCompletedList(fullUserCompletedList: any[]): any[] {
  try {
    const filteredUserCompletedList = fullUserCompletedList.filter(
      (fullListKata: any) =>
        !userCompletedDB.find((userListKata: any) => userListKata.id === fullListKata.id) ||
        !fullListKata.completedLanguages.every((fullListLanguage: string) =>
          userCompletedDB[
            userCompletedDB.findIndex((userListKata: any) => userListKata.id === fullListKata.id)
          ].completedLanguages.includes(fullListLanguage)
        )
    )
    if (!filteredUserCompletedList.length) {
      console.log("Nothing found to import!!!")
      process.exit(1)
    }
    return filteredUserCompletedList
  } catch (error) {
    console.error(`Error from filterUserCompletedList(...)`)
    throw error
  }
}
