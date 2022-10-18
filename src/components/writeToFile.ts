/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs"
import path from "node:path"
import { userCompletedDBPath } from "../../config/config"
import { format } from "prettier"
import readline from "readline"

/** Write update to completed Kata database file with latest API import data
 * This adds new Katas and additional languages completed since last import
 * @param {fullUserCompletedList: any}
 * @returns {Promise<void>}
 **/
export async function updateUserCompletedDB(fullUserCompletedList: any): Promise<void> {
  fs.writeFile(
    path.join(userCompletedDBPath),
    format(`${JSON.stringify(fullUserCompletedList)}`, {
      semi: false,
      printWidth: 125,
      trailingComma: "none",
      parser: "json"
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

/**
 * Create individual Kata root directory that will hold each completed
 * language specific directory related to the Kata
 * @param kataDetails
 * @returns {Promise<void>}
 */
export async function createKataRootDir(kataDetails: any): Promise<void> {
  try {
    await fs.mkdirSync(kataDetails.kataPath, { recursive: true, mode: 755 })
  } catch (error) {
    console.error(`Error from createKataRootDir(...) for ${kataDetails.kataPath}`)
    throw error
  }
  // console.log(`${kataDetails.kataPath} is ready`)
  return
}

/**
 * Create individual Kata language path
 * @param kataDetails
 * @param langPath
 * @returns {Promise<void>}
 */
export async function createLangDir(kataDetails: any, langPath: string): Promise<void> {
  try {
    await fs.mkdirSync(langPath, { recursive: true, mode: 755 })
  } catch (error) {
    console.error(`Error from createLangDir(...) for ${kataDetails.slug}/${kataDetails.curLang}`)
    throw error
  }
  // console.log(`${kataDetails.slug}/${kataDetails.curLang} is ready`)
  return
}

/**
 * Call to generate Kata markdown description layout & write file to disk
 * !Currently set to OVERWRITE existing markdown description
 * @param {kataDetails: any}
 * @param {mdString: string}
 * @returns {Promise<void>}
 */
export async function writeKataMarkdownFile(kataDetails: any, mdString: string): Promise<void> {
  let logMessage
  await fs.writeFile(
    path.join(kataDetails.kataPath, `${kataDetails.slug}.md`),
    mdString,
    { flag: "w", mode: 644 },
    (error) => {
      if (error) {
        if (error.code === "EEXIST") {
          logMessage = `${kataDetails.slug}.md file already exists and was NOT overwritten.`
          return
        }
        console.error(`Error from writeKataMarkdownFile(...) for ${kataDetails.slug}.md`)
        throw error
      }
      logMessage = `Writing of markdown description file for ${kataDetails.slug} successful.`
      return
    }
  )
  do {
    await new Promise((res) => setTimeout(res, 200))
  } while (!logMessage)
  await console.log(await logMessage)
  return
}

/**
 * Write user solution code block/s to file
 * ?Currently set so it will NOT overwrite an existing file
 * ?With this setting, new solutions for an existing language will be lost
 * @param {kataData: any}
 * @param {langPath: string}
 * @param {langFilename: string}
 * @param {langEx: string}
 * @returns {Promise<void>}
 */
export async function writeUserSolutionFile(
  kataData: any,
  langPath: string,
  langFilename: string,
  langExt: string
): Promise<void> {
  let logMessage
  await fs.writeFile(
    path.join(langPath, `${langFilename}.${langExt}`),
    kataData.code,
    { flag: "wx", encoding: "utf8", mode: 644 },
    (error) => {
      if (error) {
        if (error.code === "EEXIST") {
          logMessage = `${langFilename}.${langExt} CODE file already exists and was NOT overwritten.`
          return
        }
        console.error(
          `Error from writeUserSolutionFile(...) for ${langFilename}.${langExt} CODE file`
        )
        throw error
      }
      logMessage = `Writing of ${langFilename}.${langExt} CODE file was successful.`
      return
    }
  )
  do {
    await new Promise((res) => setTimeout(res, 200))
  } while (!logMessage)
  await console.log(await logMessage)
  return
}

/**
 * Write test code block/s to file
 * ?Currently set so it will NOT overwrite an existing file
 * ?With this setting, no updates or changes to tests for an existing language will occur
 * @param {kataData: any}
 * @param {langPath: string}
 * @param {langFilename: string}
 * @param {langEx: string}
 * @returns {Promise<void>}
 */
export async function writeTestFile(
  kataData: any,
  langPath: string,
  langFilename: string,
  langExt: string
): Promise<void> {
  let logMessage
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
          logMessage = `${langFilename}.${langExt} TEST file already exists and was NOT overwritten.`
          return
        }
        console.warn(`Error from writeTestFile(...) for ${langFilename}.${langExt} TEST file`)
        throw error
      }
      logMessage = `Writing of ${langFilename}.${langExt} TEST file was successful.`
      return
    }
  )
  do {
    await new Promise((res) => setTimeout(res, 200))
  } while (!logMessage)
  await console.log(await logMessage)
  return
}

/**
 * Helper function for file writing relating to progress logging.
 * Function is to run a waiting spinner while waiting for logMessage.
 * @return void
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function showWriting(): Promise<void> {
  process.stdout.write("Writing files")
  for (let i = 0; i < 5; i++) {
    process.stdout.write(".")
    await new Promise((res) => setTimeout(res, 200))
  }
  readline.clearLine(process.stdout, 0)
  return
}
