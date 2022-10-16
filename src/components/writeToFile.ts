/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs"
import path from "node:path"
import { userCompletedDBPath } from "../../config/config"
import { format } from "prettier"

export async function updateUserCompletedDB(fullUserCompletedList: any): Promise<void> {
  /** Write update to completed Kata database file with latest API import data
   * This adds new Katas and additional languages completed since last import
   * @Param const fullUserCompletedList
   **/
  fs.writeFile(
    path.join(userCompletedDBPath),
    format(`export const userCompletedDB = ${JSON.stringify(fullUserCompletedList)}`, {
      semi: false,
      printWidth: 125,
      trailingComma: "none",
      parser: "typescript"
    }),
    { flag: "w", encoding: "utf8", mode: 644 },
    (error) => {
      if (error) {
        console.error(`Error from updateUserCompleteDB(...) for ${userCompletedDBPath}`)
        throw error
      }
      console.log(`Updating of ${userCompletedDBPath} was successful`)
    }
  )
  return
}

export async function createKataRootDir(kataDetails: any): Promise<void> {
  /** Create individual Kata root directory that will hold each completed
   * language specific directory related to the Kata
   **/
  try {
    await fs.mkdirSync(kataDetails.kataPath, { recursive: true, mode: 755 })
  } catch (error) {
    console.error(`Error from createKataRootDir(...) for ${kataDetails.kataPath}`)
    throw error
  }
  console.log(`${kataDetails.kataPath} is ready`)
  return
}

export async function createLangDir(kataDetails: any, langPath: string): Promise<void> {
  // Create individual Kata language path
  try {
    await fs.mkdirSync(langPath, { recursive: true, mode: 755 })
  } catch (error) {
    console.error(`Error from createLangDir(...) for ${kataDetails.slug}/${kataDetails.curLang}`)
    throw error
  }
  console.log(`${kataDetails.slug}/${kataDetails.curLang} is ready`)
  return
}

export async function writeKataMarkdownFile(kataDetails: any, mdString: string): Promise<void> {
  /** Call to generate Kata markdown description layout & write file to disk
   * !Currently set to OVERWRITE existing markdown description
   **/
  await fs.writeFile(
    path.join(kataDetails.kataPath, `${kataDetails.slug}.md`),
    mdString,
    { flag: "w", mode: 644 },
    (error) => {
      if (error) {
        if (error.code === "EEXIST") {
          console.log(`${kataDetails.slug}.md file already exists and was NOT overwritten.`)
          return
        }
        console.error(`Error from writeKataMarkdownFile(...) for ${kataDetails.slug}.md`)
        throw error
      }
    }
  )
  console.log(`Writing of markdown description file for ${kataDetails.slug} successful.`)
  return
}

export async function writeUserSolutionFile(
  kataData: any,
  langPath: string,
  langFilename: string,
  langExt: string
): Promise<void> {
  /** Write user solution code block/s to file
   * ?Currently set so it will NOT overwrite an existing file
   * ?With this setting, new solutions for an existing language will be lost
   **/
  await fs.writeFile(
    path.join(langPath, `${langFilename}.${langExt}`),
    kataData.code,
    { flag: "wx", encoding: "utf8", mode: 644 },
    (error) => {
      if (error) {
        if (error.code === "EEXIST") {
          console.log(
            `${langFilename}.${langExt} CODE file already exists and was NOT overwritten.`
          )
          return
        }
        console.error(
          `Error from writeUserSolutionFile(...) for ${langFilename}.${langExt} CODE file`
        )
        throw error
      }
    }
  )
  console.log(`Writing of ${langFilename}.${langExt} CODE file was successful.`)
  return
}

export async function writeTestFile(
  kataData: any,
  langPath: string,
  langFilename: string,
  langExt: string
): Promise<void> {
  /** Write test code block/s to file
   * ?Currently set so it will NOT overwrite an existing file
   * ?With this setting, no updates or changes to tests for an existing language will occur
   **/
  await fs.writeFile(
    path.join(
      langPath,
      kataData.curLang === "python"
        ? `${langFilename}_test.${langExt}`
        : `${langFilename}.Test.${langExt}`
    ),
    kataData.tests,
    { flag: "wx", encoding: "utf8", mode: 644 },
    (error) => {
      if (error) {
        if (error.code === "EEXIST") {
          console.log(
            `${langFilename}.${langExt} TEST file already exists and was NOT overwritten.`
          )
          return
        }
        console.warn(`Error from writeTestFile(...) for ${langFilename}.${langExt} TEST file`)
        throw error
      }
    }
  )
  console.log(`Writing of ${langFilename}.${langExt} TEST file was successful.`)
  return
}
