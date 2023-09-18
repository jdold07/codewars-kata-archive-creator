import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { format } from "prettier"
import readline from "readline"
import { userCompletedDBPath } from "./config/config"
import { CombinedKataDetail, ExtendedKataDetails, UserCompletedDBEntry } from "./types"

/** Write update to completed Kata database file with latest API import data
 * This adds new Katas and additional languages completed since last import
 * @param {UserCompletedDBEntry[]} fullUserCompletedList - Full list of completed Katas
 * @returns {Promise<void>}
 **/
export async function updateUserCompletedDB(fullUserCompletedList: UserCompletedDBEntry[]): Promise<void> {
  try {
    // Intentionally not awaited.  App can continue as the updated file is not later referenced.
    writeFile(
      userCompletedDBPath,
      await format(`${JSON.stringify(fullUserCompletedList)}`, {
        semi: false,
        printWidth: 125,
        trailingComma: "none",
        parser: "json",
      }),
      { flag: "w", encoding: "utf8", mode: 0o644 },
    )
  } catch (error) {
    console.error(`Error from updateUserCompleteDB(...) for ${userCompletedDBPath}`)
    throw error
  }
  return
}

/**
 * Create individual Kata root directory that will hold each completed
 * language specific directory related to the Kata
 * @param {ExtendedKataDetails} extendedKataDetails
 * @returns {Promise<void>}
 */
export async function createKataRootDir(extendedKataDetails: ExtendedKataDetails): Promise<void> {
  try {
    const dirExists = existsSync(extendedKataDetails.kataPath)
    if (!dirExists) {
      // Awaited in calling function as path is required for the file to be written.
      mkdir(extendedKataDetails.kataPath, { recursive: true, mode: 0o755 })
    }
  } catch (error) {
    console.error(`Error from createKataRootDir(...) for ${extendedKataDetails.kataPath}`)
    throw error
  }
  return
}

/**
 * Create individual Kata language path
 * @param {CombinedKataDetail} formattedCombinedKataDetail
 * @param {string} langPath
 * @returns {Promise<void>}
 */
export async function createLangDir(formattedCombinedKataDetail: CombinedKataDetail, langPath: string): Promise<void> {
  try {
    const dirExists = existsSync(langPath)
    if (!dirExists) {
      // Awaited in calling function as path is required for the file to be written.
      mkdir(langPath, { recursive: true, mode: 0o755 })
    }
  } catch (error) {
    console.error(
      `Error from createLangDir(...) for ${formattedCombinedKataDetail.slug}/${formattedCombinedKataDetail.curLang}`,
    )
    throw error
  }
  return
}

/**
 * Call to generate Kata markdown description layout & write file to disk
 * @note Currently set to OVERWRITE existing markdown description
 *
 * @param {ExtendedKataDetails} extendedKataDetails - Extended kata details object
 * @param {string} mdString - Generated markdown description string
 * @returns {Promise<void>}
 */
export async function writeKataMarkdownFile(extendedKataDetails: ExtendedKataDetails, mdString: string): Promise<void> {
  console.log(`Writing markdown description file for ${extendedKataDetails.slug}...`)
  // Intentionally not awaited.  App can continue as the written file is never referenced.
  writeFile(join(extendedKataDetails.kataPath, `${extendedKataDetails.slug}.md`), mdString, {
    flag: "w",
    mode: 0o644,
  }).catch((error) => {
    if (error.code === "EEXIST") {
      console.log(`${extendedKataDetails.slug}.md file already exists and was NOT overwritten.`)
      return
    } else {
      console.error(`Error from writeKataMarkdownFile(...) for ${extendedKataDetails.slug}.md`)
      throw error
    }
  })
  return
}

/**
 * Write user solution code block/s to file
 * @note Currently set so it will NOT overwrite an existing file
 * @note With this setting, new solutions for an existing language will be lost
 *
 * @param {CombinedKataDetail} formattedCombinedKataDetail - Processed and formatted combined kata detail object
 * @param {string} langPath - Path to language directory
 * @param {string} langFilename - Kata slug reformatted to language specific case convention
 * @param {string} langExt - Language file extension
 * @returns {Promise<void>}
 */
export async function writeUserSolutionFile(
  formattedCombinedKataDetail: CombinedKataDetail,
  langPath: string,
  langFilename: string,
  langExt: string,
): Promise<void> {
  console.log(`Writing ${langFilename}.${langExt} CODE file...`)
  // Intentionally not awaited.  App can continue as the written file is never referenced.
  writeFile(join(langPath, `${langFilename}.${langExt}`), formattedCombinedKataDetail.code, {
    flag: "wx",
    encoding: "utf8",
    mode: 0o644,
  }).catch((error) => {
    if (error.code === "EEXIST") {
      console.log(`${langFilename}.${langExt} CODE file already exists and was NOT overwritten.`)
      return
    } else {
      console.error(`Error from writeUserSolutionFile(...) for ${langFilename}.${langExt} CODE file`)
      throw error
    }
  })
  return
}

/**
 * Write test code block/s to file
 * @note Currently set so it will NOT overwrite an existing file
 * @note With this setting, no updates or changes to tests for an existing language will occur
 *
 * @param {CombinedKataDetail} formattedCombinedKataDetail - Processed and formatted combined kata detail object
 * @param {string} langPath - Path to language directory
 * @param {string} langFilename - Kata slug reformatted to language specific case convention
 * @param {string} langExt - Language file extension
 * @returns {Promise<void>}
 */
export async function writeTestFile(
  formattedCombinedKataDetail: CombinedKataDetail,
  langPath: string,
  langFilename: string,
  langExt: string,
): Promise<void> {
  console.log(`Writing ${langFilename}.${langExt} TEST file...`)
  // Intentionally not awaited.  App can continue as the written file is never referenced.
  writeFile(
    join(
      langPath,
      formattedCombinedKataDetail.curLang === "python"
        ? `${langFilename}_test.${langExt}`
        : `${langFilename}.Test.${langExt}`,
    ),
    formattedCombinedKataDetail.tests,
    { flag: "wx", encoding: "utf8", mode: 0o644 },
  ).catch((error) => {
    if (error.code === "EEXIST") {
      console.log(`${langFilename}.${langExt} TEST file already exists and was NOT overwritten.`)
      return
    } else {
      console.error(`Error from writeTestFile(...) for ${langFilename}.${langExt} TEST file`)
      throw error
    }
  })
  return
}

/**
 * Helper function for file writing relating to progress logging.
 * Function is to run a waiting spinner while waiting for logMessage.
 * @return void
 */
export async function showWriting(): Promise<void> {
  process.stdout.write("Writing files")
  for (let i = 0; i < 5; i++) {
    process.stdout.write(".")
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  readline.clearLine(process.stdout, 0)
  return
}
