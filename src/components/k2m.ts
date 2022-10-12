/* eslint-disable @typescript-eslint/no-explicit-any */
import getNewCompletedKatas from "./getUserCompletedList"
import getKataDetails from "./getKataDetails"
import { changeCase } from "./helpers"
import * as config from "../../private/config/config"
import fs from "node:fs"
import path from "node:path"
import axios from "axios"
import axiosThrottle from "axios-request-throttle"

// Axios request throttling to prevent too many requests error from codewars.com on large imports
axiosThrottle.use(axios, { requestsPerSecond: 1 })

// Variables
const filteredCompletedKatas = getNewCompletedKatas()
const kataDetails = getKataDetails(filteredCompletedKatas)

// Set language path
const langPath = path.join(fullPath, v)
// Set language file extension
const langExt = config.myLanguages.get(v)?.extension
// Set filename case type
const kataFilename = v === "python" ? changeCase(kata.slug, "s") : changeCase(kata.slug, "c")

// Create individual Kata language path
if (KATA.code !== "") {
  try {
    fs.mkdirSync(langPath, { recursive: true, mode: 755 })
    console.log(`Create /${kata.slug}/${v} directory`)
  } catch (err) {
    console.warn(`Error creating /${kata.slug}/${v} directory\n${err}`)
  }

  // Generate & write solution code file //? Set to NOT write if file exists
  try {
    fs.writeFileSync(path.join(langPath, `${kataFilename}.${langExt}`), formatString(KATA, v, kataFilename, "code"), {
      flag: "wx",
      mode: 644
    })
    console.log(`Writing ${kataFilename}.${langExt} CODE file`)
  } catch (err) {
    console.warn(`Error writing ${kataFilename}.${langExt} CODE file\n${err}`)
  }

  // Generate & write tests code file //? Set to NOT write if file exists
  try {
    fs.writeFileSync(
      path.join(langPath, v === "python" ? `${kataFilename}_test.${langExt}` : `${kataFilename}.Test.${langExt}`),
      formatString(KATA, v, kataFilename, "test"),
      { flag: "wx", mode: 644 }
    )
    console.log(`Writing ${kataFilename}.${langExt} TESTS file`)
  } catch (err) {
    console.warn(`Error writing ${kataFilename}.${langExt} TESTS file\n${err}`)
  }
}

// Fire it up!
getKataDetails()
console.log("Processing COMPLETE!  Check output path to confirm everything has completed as expected.")
process.exitCode = 0

// writePathsAndFiles(response.data, kataPath, kata)
