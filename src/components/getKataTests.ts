import { Axios, KATA_ID, SESSION_ID } from "../index"
import cheerio from "cheerio"

const kataTests: { id: string; language: string; code: string } = { id: "", language: "", code: "" }

/*
 *Fetch Kata Tests detail from Codewars.com for processing
 *@Param: id <string> Kata ID number
 *@Param: language <string> Kata Language of Test Data
 *@Return => Kata Test Code {
 * kataTests <any Object>: { id <string>; language <string>; code <string> }
 *}
 */
async function getKataTests(id = KATA_ID, language: string) {
  try {
    const response = await Axios.get(`https://www.codewars.com/kata/${id}/solutions/${language}`, {
      headers: { Cookie: SESSION_ID }
    })
    const $ = cheerio.load(response.data)
    const code = $("#kata-details-description", response.data).siblings().find("code").text()

    Object.assign(kataTests, { id: id, language: language, code: code })

    console.log("Retrieved Kata TEST data from Codewars.com")
    return kataTests
  } catch (err) {
    console.error(`Error fetching Kata TESTS from Codewars.com for ${id} in ${language}\n${err}`)
    // throw Error(`Get Kata detail for ${id}\n${err}`)
  }
}

export { getKataTests, kataTests }
