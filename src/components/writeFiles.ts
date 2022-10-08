/* eslint-disable @typescript-eslint/no-explicit-any */
import { join, fs, LANGUAGES, formatCodeString } from "../index"

/*
Create directory structure if it doesn't exist, write code & test file templates
for set languages, write Markdown description file to Kata root directory
  @Param:
  @Return =>
*/
export function writePathsAndFiles(kata: any, fullPath: string, kataSnakeCase: string, kataCamelCase: string) {
  Array.from(LANGUAGES.keys())
    .filter((v) => kata.languages.includes(v))
    .forEach((v) => {
      const pathLang = join(fullPath, LANGUAGES?.get(v)?.name || "UNKOWNN")
      const fileExtension = LANGUAGES?.get(v)?.extension

      try {
        fs.mkdirSync(join(fullPath, pathLang), { recursive: true, mode: 755 })
        console.log(`Creating /${kataSnakeCase}/${pathLang} directory`)
      } catch (err) {
        console.warn(`Error while creating /${kataSnakeCase}/${v} directory\n${err}`)
      }

      const kataFilename = v === "python" ? kataSnakeCase : kataCamelCase

      try {
        fs.writeFileSync(join(pathLang, `${kataFilename}.${fileExtension}`), formatCodeString(kata, v), {
          flag: "wx",
          mode: 644
        })
        console.log(`Writing ${kataFilename}.${fileExtension} CODE file`)
      } catch (err) {
        console.warn(`Error writing ${kataFilename}.${fileExtension} CODE file\n${err}`)
      }
      try {
        fs.writeFileSync(
          join(pathLang, v === "python" ? `${kataFilename}_test.${fileExtension}` : `${kataFilename}.Test.${fileExtension}`),
          "",
          { flag: "wx", mode: 644 }
        )
        console.log(`Writing $${kataFilename}.${fileExtension} TEST file`)
      } catch (err) {
        console.warn(`Error writing ${kataFilename}.${fileExtension} TEST file\n${err}`)
      }
    })
}

export default writePathsAndFiles
