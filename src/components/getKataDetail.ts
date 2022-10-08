import { Axios, KATA_ID } from "../index"
/*
 *Fetch completed Kata detail from Codewars API for processing
 *@Param: id <string> Kata ID number
 *@Return => Current Kata Detail {
 * data <any Object>: response.data for current ID
 * kataCamelCase <string>: Kata slug transformed to camelCase
 * kataSnakeCase <string>: Kata slug transformed to snake_case
 * rankFolder <string>: Kata rank folder name (eg 8_Kyu_Kata)
 *}
 */
export async function getKataDetail() {
  try {
    const response = await Axios.get(`https://www.codewars.com/api/v1/code-challenges/${KATA_ID}`)
    const kataDetail = {
      data: response.data,
      kataCamelCase: caseType(response.data.slug, "c"),
      kataSnakeCase: caseType(response.data.slug, "s"),
      rankFolder: `${Math.abs(response.data.rank.id) || "BETA"}_Kyu_Kata`
    }
    return kataDetail
  } catch (err) {
    console.error(`Error fetching Kata detail from Codewars API for ${KATA_ID}\n${err}`)
    // throw Error(`Get Kata detail for ${id}\n${err}`)
  }
}

/*
 *Helper function for filename case convention specific to individual languages
 *@Param: slug <string> Kata name in slug format (eg this-kata-name)
 *@Param: flag <string> Identifier for case type ("c", "s", default="no")
 *@Return => <string> Kata slug reformatted to language case convention
 */
const caseType = (slug: string, flag = "no") =>
  flag === "c"
    ? slug.replace(/-(\w)/g, (_: string, $1: string) => `${$1.slice(0, 1).toUpperCase()}${$1.slice(1)}`)
    : slug.replace(/-/g, "_")

export default getKataDetail
