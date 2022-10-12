/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs"
import path from "node:path"
import { userCompletedDBPath } from "../../private/config/config"
import parseForMD from "./parseForMD"

export async function updateUserCompletedDB(fullUserCompletedList: any): Promise<void> {
  /** Write update to completed Kata database file with latest API import data
   * This adds new Katas and additional languages completed since last import
   * @Param const fullUserCompletedList
   **/
  fs.writeFile(
    path.join(userCompletedDBPath),
    `export const existingCompleted = ${JSON.stringify(fullUserCompletedList)}`,
    { flag: "w", encoding: "utf8", mode: 644 },
    (error) => {
      if (error) {
        console.error(`Error while writing ${path.basename(__filename)}`)
        throw Error(`Error writing to ${userCompletedDBPath}\n${error}`)
      }
      console.log(`Writing of ${path.basename(__filename)} was successful`)
    }
  )
}

export async function createKataRootDir(kataDetails: any) {
  /** Create individual Kata root directory that will hold each completed
   * language specific directory related to the Kata
   **/
  fs.mkdir(await kataDetails.kataPath, { recursive: true, mode: 755 }, (error) => {
    if (error) {
      console.error(`Error from createKataRootDir() in ${path.basename(__filename)}`)
      throw Error(`Error creating ${kataDetails.kataPath}\n${error}`)
    }
    console.log(`${kataDetails.kataPath} is ready`)
  })
}

export async function writeKataMarkdownFile(kataDetails: any) {
  /** Call to generate Kata markdown description layout & write file to disk
   * !Currently set to OVERWRITE existing markdown description
   **/
  fs.writeFile(
    path.join(kataDetails.kataPath, `${kataDetails.slug}.md`),
    parseForMD(kataDetails),
    {
      flag: "w",
      mode: 644
    },
    (error) => {
      if (error) {
        console.error(`Error from writeKataMarkdownFile(...) in ${path.basename(__filename)}`)
        throw Error(`Error writing ${kataDetails.slug}.md\n${error}`)
      }
    }
  )
  console.log(`Writing of markdown description file for ${kataDetails.slug} successful.`)
}
