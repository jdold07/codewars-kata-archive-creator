/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios"
import path from "path"
import { rootPath } from "../../config/config"

/**
 * Fetch completed kata detail from Codewars API & process folders & markdown description file
 * @param {filteredCompletedKataList:
 *    data: {
 *      id: string
 *      name: string
 *      slug: string
 *      completedLanguages: string[]
 *      completedAt: string
 *    }[]}
 * @returns {Promise<any>}
 */
export default async function getKataDetails(kata: any): Promise<any> {
  try {
    const response = await axios.get(`https://www.codewars.com/api/v1/code-challenges/${kata.id}`)

    // Add an underscore to the beginning of any slug that starts with a number for path compatibility
    response.data.slug = await response.data.slug.replace(/^(\d)/, "_$1")
    const kataRankDirName = `kata-${Math.abs(response.data.rank.id) || "beta"}-kyu`
    const kataPath: string = path.join(rootPath, kataRankDirName, response.data.slug)

    return await Object.assign({}, kata, response.data, {
      kataRankDirName: kataRankDirName,
      kataPath: kataPath
    })
  } catch (error) {
    console.error(`Error from getKataDetails() for ${kata.slug}`)
    throw error
  }
}
