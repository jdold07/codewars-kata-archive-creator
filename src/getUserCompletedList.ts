import fetch from "node-fetch"
import { userCompletedDBPath, userID } from "./config/config"
import type { CodewarsApiResponse, UserCompletedDBEntry } from "./types"
import { updateUserCompletedDB } from "./writeToFile"
const userCompletedDB: UserCompletedDBEntry[] = await import(userCompletedDBPath, { assert: { type: "json" } }).then(
  (jsonFile) => jsonFile.default,
)

/**
 * Entry point for fetching new/current Completed Kata List from API
 * 1. Fetch current list of completed katas from the Codewars API
 * 2. Filter the received completed kata list against the current user completed kata DB
 * 3. Returns the filtered list of completed katas
 * @returns {UserCompletedDBEntry[]} - Filtered list of completed Katas
 */
export default async function getUserCompletedList(): Promise<{
  filteredUserCompletedList: UserCompletedDBEntry[]
  fuclLength: number
}> {
  console.log("Fetching user completed katas from the Codewars API...")
  const fullUserCompletedList = await fetchUserCompletedList()
  console.log("Filtering previously processed user completed katas from the API list...")
  const filteredUserCompletedList = await filterUserCompletedList(fullUserCompletedList)
  console.log("Updating the user completed katas database with new katas...")
  // No need to await as the updated file is not referenced after it has been updated.
  updateUserCompletedDB(fullUserCompletedList)
  return { filteredUserCompletedList, fuclLength: fullUserCompletedList.length }
}

/**
 * Fetch latest complete list of completed Katas
 * Used to assert which Katas need downloading of Kata Detail from API &
 * for completion date & completed languages info
 * @returns {Promise<UserCompletedDBEntry[]>}
 */
async function fetchUserCompletedList(): Promise<UserCompletedDBEntry[]> {
  try {
    let page = 0
    let responseBody: CodewarsApiResponse
    const fullUserCompletedList: UserCompletedDBEntry[] = []

    do {
      responseBody = JSON.parse(
        await fetch(`http://www.codewars.com/api/v1/users/${userID}/code-challenges/completed?page=${page}`).then(
          (res) => res.text(),
        ),
      )
      fullUserCompletedList.push(...responseBody.data)
      page += 1
    } while (page < responseBody?.totalPages || 0)
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
 * @param {UserCompletedDBEntry[]} fullCompletedKataList - Full list of completed Katas
 * @returns {Promise<UserCompletedDBEntry[]>} - Filtered list of completed Katas
 **/
async function filterUserCompletedList(fullUserCompletedList: UserCompletedDBEntry[]): Promise<UserCompletedDBEntry[]> {
  try {
    const filteredUserCompletedList = fullUserCompletedList.filter(
      (fullListKata) =>
        !userCompletedDB.find((userListKata) => userListKata.id === fullListKata.id) ||
        !fullListKata.completedLanguages.every((fullListLanguage: string) =>
          userCompletedDB[
            userCompletedDB.findIndex((userListKata) => userListKata.id === fullListKata.id)
          ].completedLanguages.includes(fullListLanguage),
        ),
    )

    if (!filteredUserCompletedList.length) {
      console.log("No new katas found.  Exiting...")
      process.exit(0)
    }
    console.log(`Found ${filteredUserCompletedList.length} new katas that require updating...`)
    return filteredUserCompletedList
  } catch (error) {
    console.error(`Error from filterUserCompletedList(...)`)
    throw error
  }
}
