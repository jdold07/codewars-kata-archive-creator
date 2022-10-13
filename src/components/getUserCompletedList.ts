/* eslint-disable @typescript-eslint/no-explicit-any */
import { userCompletedDB } from "../../private/config/userCompletedDB"
import { userID } from "../../private/config/config"
import { updateUserCompletedDB } from "./writeToFile"
import axios from "axios"
import path from "node:path"

export default async function getUserCompletedList(): Promise<any> {
  /**Entry point for fetching new/current Completed Kata List from API
   * Step 1 - Fetch current complete list of Completed Kata List from API
   * Step 2 - Filter the collected list against existing completed Kata DB
   * Step 3 - Write updates to existing completed Kata DB
   * @Return const filteredCompletedKataList:
   *    data: {
   *      id: string
   *      name: string
   *      slug: string
   *      completedLanguages: string[]
   *      completedAt: string
   *    }[]
   */
  const fullUserCompletedList = await fetchUserCompletedList()
  const filteredCompletedKataList = await filterUserCompletedList(fullUserCompletedList)
  await updateUserCompletedDB(fullUserCompletedList)
  return await filteredCompletedKataList
}

async function fetchUserCompletedList(): Promise<any> {
  /**Fetch latest current list of completed Katas
   * Used to assert which Katas need downloading of Kata Detail from API &
   * for completion date & completed languages info
   **/
  try {
    let page = 0
    let response
    const fullUserCompletedList: any[] = []

    do {
      response = await axios.get(`http://www.codewars.com/api/v1/users/${userID}/code-challenges/completed?page=${page}`)
      fullUserCompletedList.push(...response.data.data)
      page += 1
    } while (page < response?.data?.totalPages || 0)
    return fullUserCompletedList
  } catch (error) {
    console.error(`Error from fetchUserCompletedList() in ${path.basename(__filename)}`)
    throw Error(`Error fetching Completed Kata list\n${error}`)
  }
}

function filterUserCompletedList(fullUserCompletedList: any[]) {
  /**Filters complete list of completed Katas against the existing completed Kata DB
   * Filtered list provides detail of any Kata that is required to be added or
   * any Kata that requires updating due to a new language completion.
   * The completed Kata list also contains completion information, specifically
   * the completion date and what languages the Kata has been completed in.
   * @Param const fullCompletedKataList: {
   *   totalPages: number
   *   totalItems: number
   *   data: {
   *           id: string
   *           name: string
   *           slug: string
   *           completedLanguages: string[]
   *           completedAt: string
   *         }[]
   *   }
   * @Return filteredCompleteKataList:
   *   data: {
   *      id: string
   *      name: string
   *      slug: string
   *      completedLanguages: string[]
   *      completedAt: string
   *    }[]
   **/
  try {
    const filteredUserCompletedList = fullUserCompletedList.filter(
      (fullListKata: any) =>
        !userCompletedDB.data.find((userListKata) => userListKata.id === fullListKata.id) ||
        !fullListKata.completedLanguages.every((fullListLanguage: string) =>
          userCompletedDB.data[
            userCompletedDB.data.findIndex((userListKata) => userListKata.id === fullListKata.id)
          ].completedLanguages.includes(fullListLanguage)
        )
    )
    if (!filteredUserCompletedList.length) {
      console.log("Nothing found to import!!!")
      process.exitCode = 1
    }
    return filteredUserCompletedList
  } catch (error) {
    console.error(`Error from filterUserCompletedList() in ${path.basename(__filename)}`)
    throw Error(`There was a problem filtering Completed Kata list\n${error}`)
  }
}
