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

export async function createLangDir(kataDetails: any, langPath: string) {
  // Create individual Kata language path
  fs.mkdir(langPath, { recursive: true, mode: 755 }, (error) => {
    if (error) {
      console.error(`Error from createLangDir() in ${path.basename(__filename)}`)
      throw Error(`Error creating ${kataDetails.slug}/${kataDetails.curLang}\n${error}`)
    }
    console.log(`${kataDetails.slug}/${kataDetails.curLang} is ready`)
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

export async function writeUserSolutionFile(kataData: any, langPath: string, langFilename: string, langExt: string) {
  /** Write user solution code block/s to file
   * ?Currently set so it will NOT overwrite an existing file
   * ?With this setting, new solutions for an existing language will be lost
   **/
  fs.writeFile(
    path.join(langPath, `${langFilename}.${langExt}`),
    kataData.code,
    { flag: "wx", encoding: "utf8", mode: 644 },
    (error) => {
      if (error) {
        console.warn(`WARNING from writeUserSolutionFile(...) in ${path.basename(__filename)}`)
        console.warn(`While writing ${langFilename}.${langExt} CODE file\n${error}`)
        //todo No throw because if file exists, error will exist.  Need to determine the file exist error and catch everything but into a throw Error
      } else {
        console.log(`Writing of ${langFilename}.${langExt} CODE file was successful.`)
      }
    }
  )
}

export async function writeTestFile(kataData: any, langPath: string, langFilename: string, langExt: string) {
  /** Write test code block/s to file
   * ?Currently set so it will NOT overwrite an existing file
   * ?With this setting, no updates or changes to tests for an existing language will occur
   **/
  fs.writeFile(
    path.join(
      langPath,
      kataData.curLang === "python" ? `${langFilename}_test.${langExt}` : `${langFilename}.Test.${langExt}`
    ),
    kataData.tests,
    { flag: "wx", encoding: "utf8", mode: 644 },
    (error) => {
      if (error) {
        console.warn(`WARNING from writeTestFile(...) in ${path.basename(__filename)}`)
        console.warn(`While writing ${langFilename}.${langExt} TEST file\n${error}`)
        //todo No throw because if file exists, error will exist.  Need to determine the file exist error and catch everything but into a throw Error
      } else {
        console.log(`Writing of ${langFilename}.${langExt} TEST file was successful.`)
      }
    }
  )
}
