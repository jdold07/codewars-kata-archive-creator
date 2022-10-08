/* eslint-disable @typescript-eslint/no-explicit-any */
// import COMPLETED_KATA_DATA from "../private/assets/completedKata"
// import getKataDetail from "./components/getKataDetail"
// import formatCodeString from "./components/formatCodeString"
import Axios from "axios"
import { join } from "node:path"
import fs from "node:fs"

// Import constants
// export const kata = getKataDetail().then(
//   (res: any) => res.data,
//   (err) => console.error(err)
// )

// App constants
const KATA_ID: string | undefined = "5324945e2ece5e1f32000370"
const SESSION_ID =
  "_session_id=f8b560c2297e63decb4c3f73a4ef4b7c; Expires=Sat, 08 Oct 2022 00:52:36 GMT; Path=/; HttpOnly; SameSite=Lax; Domain=www.codewars.com"
const COMPLETED_LANGUAGES = ["javascript", "coffeescript", "python"]
const COMPLETED_DATE = "2022-10-05"
const USER = "jdold07"
const PATH_KATA_DETAIL = "https://www.codewars.com/api/v1/code-challenges/"
const PATH_USER_COMPLETED = `http://www.codewars.com/api/v1/users/${USER}/code-challenges/completed?page=`
const PATH_USER_DATA = `http://www.codewars.com/api/v1/users/${USER}`
const ROOTFOLDER = "/Users/jdold07/Dropbox/Code/Codewars_Solutions"
const LANGUAGES = new Map([
  ["javascript", { name: "JavaScript", extension: "js" }],
  ["typescript", { name: "TypeScript", extension: "ts" }],
  ["coffeescript", { name: "CoffeeScript", extension: "coffee" }],
  ["python", { name: "Python", extension: "py" }],
  ["swift", { name: "Swift", extension: "swift" }]
])

// Main module
// function runSingleKata() {
//   return
// }

// Exports
export {
  // COMPLETED_KATA_DATA,
  SESSION_ID,
  KATA_ID,
  COMPLETED_LANGUAGES,
  COMPLETED_DATE,
  ROOTFOLDER,
  PATH_KATA_DETAIL,
  PATH_USER_COMPLETED,
  USER,
  PATH_USER_DATA,
  LANGUAGES,
  // getKataDetail,
  // formatCodeString,
  Axios,
  join,
  fs
}

console.log("Success!  It looks like everything has completed as expected.")
