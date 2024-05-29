import fetch from "node-fetch"
import { join } from "path"
import { rootPath } from "./config/config.js"
import { ExtendedKataDetails, KataDetails, UserCompletedDBEntry } from "./types.js"

/**
 * Fetch completed kata detail from Codewars API & process folders & markdown description file
 * @param {UserCompletedDBEntry} kata - Kata object from userCompletedDB
 * @returns {Promise<ExtendedKataDetails>} - Kata details object
 */
export default async function getKataDetails(kata: UserCompletedDBEntry): Promise<ExtendedKataDetails> {
  try {
    const kataDetail: KataDetails = JSON.parse(
      await (await fetch(`https://www.codewars.com/api/v1/code-challenges/${kata.id}`, { method: "GET" })).text(),
    )

    // Add an underscore to the beginning of any slug that starts with a number for path compatibility
    kataDetail.slug = kataDetail.slug.replace(/^(\d)/, "_$1")
    const kataRankDirName = `kata-${Math.abs(kataDetail.rank.id) || "beta"}-kyu`
    const kataPath: string = join(rootPath, kataRankDirName, kataDetail.slug)

    return { ...kata, ...kataDetail, kataRankDirName, kataPath }
  } catch (error) {
    console.error(`Error from getKataDetails() for ${kata.slug}`)
    throw error
  }
}
