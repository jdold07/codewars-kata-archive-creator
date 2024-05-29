import { changeSlugCase } from "./helpers.js"
import { CombinedKataDetail } from "./types.js"

/**
 * Format code block strings for writing code &/or test files
 * @param {CombinedKataDetail} combinedKataDetail - Combined kata details object
 * @returns {Promise<CombinedKataDetail>} - Combined kata details object with formatted code & test block strings ready for writing
 */
export default async function processCodeStrings(combinedKataDetail: CombinedKataDetail): Promise<CombinedKataDetail> {
  const langFilename =
    combinedKataDetail.curLang === "python"
      ? changeSlugCase(combinedKataDetail.slug, "s")
      : combinedKataDetail.curLang === "csharp"
      ? changeSlugCase(combinedKataDetail.slug, "p")
      : changeSlugCase(combinedKataDetail.slug, "c")

  switch (combinedKataDetail.curLang) {
    case "typescript":
      return typescriptFormatting(combinedKataDetail, langFilename)
    case "javascript":
      return javascriptFormatting(combinedKataDetail, langFilename)
    case "csharp":
      return csharpFormatting(combinedKataDetail, langFilename)
    case "swift":
      return swiftFormatting(combinedKataDetail, langFilename)
    case "python":
      return pythonFormatting(combinedKataDetail, langFilename)
    case "coffeescript":
      return coffeescriptFormatting(combinedKataDetail, langFilename)
    default:
      //! CATCHALL - Should not ever hit this!  Provides a default return or break for TS
      console.error(`LANGUAGE NOT FOUND while formatting strings for ${combinedKataDetail.slug}\n  ${combinedKataDetail.slug}, ${combinedKataDetail.curLang}, ${langFilename}`)
      throw new Error(
        `LANGUAGE NOT FOUND while formatting strings for ${combinedKataDetail.slug} in ${combinedKataDetail.curLang}`,
      )
  }
}

/**
 * ?Typescript specific formatting
 * @param combinedKataDetail
 * @param langFilename
 * @returns {Promise<CombinedKataDetail>} - CombinedKataDetail with formatted code & test block strings for Typescript
 */
async function typescriptFormatting(
  combinedKataDetail: CombinedKataDetail,
  langFilename: string,
): Promise<CombinedKataDetail> {
  // CODE STRING - Reformat export, imports & test config for local use

  const preProcessedKata = { ...combinedKataDetail, ...(await slashCommentPreprocess(combinedKataDetail)) }

  // Remove existing exports on top level const & functions & any object exports
  preProcessedKata.code = preProcessedKata?.code.replace(
    /^export\s(?:(?:default\s)?(?=(?:const|let|var|function|class))|({.*)?$)/g,
    "",
  )
  // Append export object that includes all top level const and/or function names
  preProcessedKata.code = `${preProcessedKata?.code}\nexport { ${(
    preProcessedKata?.code?.match(/(?<=(?:^const|^function|^class)\s)(\w+)(?=(?:\s=\s\(|\s?\())/gm) || ["UNKNOWN"]
  )?.join(", ")} }`

  // TEST STRING - Reformat export, imports & test config for local use

  // Remove any existing reference to Test.
  // currentKataData.tests = currentKataData?.tests.replace(/\bTest\./g, "")
  // Replace assertions with Chai types
  // currentKataData.tests = currentKataData?.tests.replace(/assert.equal/g, "assert.strictEqual")
  // Remove any existing reference to require/import chai or ./solution
  preProcessedKata.tests = preProcessedKata?.tests.replace(/^.*(?:chai|\.\/solution).*$/gm, "")
  // Remove any existing reference in assertions for "solution."
  preProcessedKata.tests = preProcessedKata?.tests.replace(/solution\./g, "")
  // Insert import for Chai & CODE file/module
  preProcessedKata.tests = `\nimport { assert } from ("chai")\nimport { ${
    (preProcessedKata?.tests.match(/(?<=(?:assert|expect)\.\w+(?:\s|\s?\())(\w+)(?=(?:\s|\s?\())/) || ["UNKNOWN"])[0]
  } } from ("./${langFilename}")\n\n${preProcessedKata?.tests}\n`

  return slashCommentReturn(preProcessedKata)
}

/**
 * ?Javascript specific formatting
 * @param combinedKataDetail
 * @param langFilename
 * @returns {Promise<CombinedKataDetail>} - CombinedKataDetail with formatted code & test block strings for Javascript
 */
async function javascriptFormatting(
  combinedKataDetail: CombinedKataDetail,
  langFilename: string,
): Promise<CombinedKataDetail> {
  // CODE STRING - Reformat export, imports & test config for local use

  const preProcessedKata = { ...combinedKataDetail, ...(await slashCommentPreprocess(combinedKataDetail)) }

  // Append export object that includes all top level const and/or function names
  preProcessedKata.code = `${preProcessedKata?.code}\nmodule.exports = { ${(
    preProcessedKata?.code?.match(
      /(?:(?<=(?:^const|^function|^class)\s)(\w+)(?=(?:\s=\s\(|\s?\()))|^\w+(?=\s=[\s\n]+\()/gm,
    ) || ["UNKNOWN"]
  )?.join(", ")} }`

  // TEST STRING - Reformat export, imports & test config for local use
  // Remove any existing reference to require/import chai or ./solution
  preProcessedKata.tests = preProcessedKata?.tests.replace(/^.*(?:chai|\.\/solution).*$/gm, "")
  // Remove any existing reference in assertions for "solution."
  preProcessedKata.tests = preProcessedKata?.tests.replace(/solution\./g, "")
  // Replace assertions with Chai types
  preProcessedKata.tests = preProcessedKata?.tests
    .replace(/expectError/g, "assert.throws")
    .replace(/expectNoError/g, "assert.doesNotThrow")
    .replace(/assertEquals/g, "assert.strictEqual")
    .replace(/(assertDeepEquals|assertSimilar)/g, "assert.deepEqual")
    .replace(/assertNotSimilar/g, "assert.notDeepEqual")
    .replace(/assertNotEquals/g, "assert.notStrictEqual")
    .replace(/(assertFuzzyEquals|assertApproxEquals)/g, "assert.approximately")
    .replace(/\bTest.log\b/g, "console.log")
  // Check for use of old Codewars JS Framework utility methods to a filtered array of any utilities present
  const cwUtilMethods = ["randomNumber", "randomToken", "randomize", "sample", "inspect"].filter((util) =>
    new RegExp(`Test.${util}`).test(preProcessedKata?.tests),
  )
  // Insert import for Chai, old Codewars framework utilities & CODE file/module
  preProcessedKata.tests = `${
    cwUtilMethods.length ? `\nconst { ${cwUtilMethods.join(", ")} } = require("../../../utils/cwUtils")` : ""
  }\nconst { assert${/Test.expect/.test(preProcessedKata?.tests) ? ", expect" : ""} } = require("chai")\nconst { ${
    (preProcessedKata?.tests.match(/(?<=(?:assert|expect)\.\w+(?:\s|\s?\())(\w+)(?=(?:\s|\s?\())/) || ["UNKNOWN"])[0]
  } } = require("./${langFilename}")\n\n${preProcessedKata?.tests}\n`
  // Remove any existing reference to Test
  preProcessedKata.tests = preProcessedKata?.tests.replace(/\bTest\./g, "")

  return slashCommentReturn(preProcessedKata)
}

/**
 * ?C# specific formatting
 * @param combinedKataDetail
 * @param langFilename
 * @returns {Promise<CombinedKataDetail>} - CombinedKataDetail with formatted code & test block strings for C#
 */
async function csharpFormatting(
  combinedKataDetail: CombinedKataDetail,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  langFilename: string,
): Promise<CombinedKataDetail> {
  // CODE STRING - Reformat export, imports & test config for local use
  const preProcessedKata = { ...combinedKataDetail, ...(await slashCommentPreprocess(combinedKataDetail)) }

  // TEST STRING - Reformat export, imports & test config for local use
  return slashCommentReturn(preProcessedKata)
}

/**
 * ?Swift specific formatting
 * @param combinedKataDetail
 * @param langFilename
 * @returns {Promise<CombinedKataDetail>} - kataData with formatted code & test block strings
 */
async function swiftFormatting(
  combinedKataDetail: CombinedKataDetail,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  langFilename: string,
): Promise<CombinedKataDetail> {
  // CODE STRING - Reformat export, imports & test config for local use
  const preProcessedKata = { ...combinedKataDetail, ...(await slashCommentPreprocess(combinedKataDetail)) }

  // TEST STRING - Reformat export, imports & test config for local use
  return slashCommentReturn(preProcessedKata)
}

/**
 * ?Python specific formatting
 * @param combinedKataData
 * @param langFilename
 * @returns {Promise<CombinedKataDetail>} - kataData with formatted code & test block strings
 */
async function pythonFormatting(
  combinedKataData: CombinedKataDetail,
  langFilename: string,
): Promise<CombinedKataDetail> {
  // CODE STRING - Reformat export, imports & test config for local use

  const preProcessedKata = { ...combinedKataData, ...(await hashCommentPreprocess(combinedKataData)) }

  // TEST STRING - Reformat export, imports & test config for local use
  // Remove any existing import of Codewars framework & import of "solution" module
  preProcessedKata.tests = preProcessedKata?.tests
    .replace(/import codewars_test as test/g, "")
    .replace(/from solution import \w+/g, "")
  // Insert import for Codewars python test framework & import CODE module to TEST
  preProcessedKata.tests = `import codewars_test as test\nfrom ${langFilename} import ${
    (preProcessedKata?.tests?.match(/(?<=equals\()(\w+)(?=\()/) || ["UNKNOWN"])[0]
  }\n\n\n${preProcessedKata.tests}`

  return hashCommentReturn(preProcessedKata)
}

/**
 * ?Coffeescript specific formatting
 * @param combinedKataDetail
 * @param langFilename
 * @returns {Promise<CombinedKataDetail>} - kataData with formatted code & test block strings
 */
async function coffeescriptFormatting(
  combinedKataDetail: CombinedKataDetail,
  langFilename: string,
): Promise<CombinedKataDetail> {
  // CODE STRING - Reformat export, imports & test config for local use

  const preProcessedKata = { ...combinedKataDetail, ...(await hashCommentPreprocess(combinedKataDetail)) }

  // Append export group of top level declarations
  preProcessedKata.code = `${preProcessedKata?.code}\nmodule.exports = { ${
    preProcessedKata?.code?.match(/^(\w+)(?=(?:\s=\s\(\w+).*(?:->|=>))/gm) || ["UNKNOWN"]?.join(", ")
  } }`
  // TEST STRING - Reformat export, imports & test config for local use
  // Remove any existing reference to Test
  preProcessedKata.tests = preProcessedKata?.tests.replace(/\bTest\./g, "")
  // Replace assertions with Chai types
  preProcessedKata.tests = preProcessedKata?.tests
    .replace(/assertEquals/g, "assert.strictEqual")
    .replace(/(assertDeepEquals|assertSimilar)/g, "assert.deepEqual")
  // Insert import for Chai & CODE file/module
  preProcessedKata.tests = `\n{ assert } = require "chai"\n{ ${
    (preProcessedKata?.tests.match(/(?<=assert\.\w+(?:\s|\s?\())(\w+)(?=(?:\s|\)|\())/) || ["UNKNOWN"])[0]
  } } = require "./${langFilename}"\n\n${preProcessedKata?.tests}\n`

  return hashCommentReturn(preProcessedKata)
}

/**
 * ? COMMON to all DOUBLE FORWARD SLASH COMMENT languages
 * @param combinedKataDetail
 * @returns {Promise<CombinedKataDetail>} - kataData with formatted code & test block strings
 */
async function slashCommentPreprocess(combinedKataDetail: CombinedKataDetail): Promise<CombinedKataDetail> {
  // TEST STRING - Reformat export, imports & test config for local use
  // Remove initial any default comment block
  combinedKataDetail.tests = combinedKataDetail?.tests.replace(
    /^(?:(?:\/\/|\/\*).*|\n|\r|\u2028|\u2029|\*\/)*(?=\w)/,
    "",
  )
  // Remove any trailing default comment block
  combinedKataDetail.tests = combinedKataDetail?.tests.replace(
    /(?<=.\n|\r|\u2028|\u2029)(?:(?:\/\/|\/\*).*|\n|\r|\u2028|\u2029|\*\/)*(?=$)/,
    "",
  )
  return combinedKataDetail
}

/**
 * ? COMMON to all DOUBLE FORWARD SLASH COMMENT languages
 * Return formatted header on code & test strings for DOUBLE FORWARD SLASH COMMENT languages
 * @param {CombinedKataDetail} preProcessedKata - {CombinedKataDetail} - kataData with formatted code & test block strings for DOUBLE FORWARD SLASH COMMENT languages
 * @returns {Promise<CombinedKataDetail>} - kataData with formatted code & test block strings with formatted header for DOUBLE FORWARD SLASH COMMENT languages
 */
async function slashCommentReturn(preProcessedKata: CombinedKataDetail): Promise<CombinedKataDetail> {
  const codeBlockStrings = ["code", "test"].map(
    (flag) =>
      `//+ ${"=".repeat(116)}\n//+\n//+ ${preProcessedKata?.rank
        ?.name} - ${preProcessedKata?.name}  [ ID: ${preProcessedKata?.id} ] (${preProcessedKata?.slug})\n//+ URL: ${
        preProcessedKata.url
      }\n//+ Category: ${preProcessedKata?.category?.toUpperCase()}  |  Tags: ${
        preProcessedKata?.tags?.join(" | ").toUpperCase() || "NONE"
      }\n//+\n//+ ${"=".repeat(116)}\n\n${
        (flag === "code" ? preProcessedKata?.code : preProcessedKata?.tests) || ""
      }\n`,
  )
  return { ...preProcessedKata, code: codeBlockStrings[0], tests: codeBlockStrings[1] }
}

/**
 * ? COMMON to all HASH COMMENT languages
 * @param combinedKataDetail
 * @returns {Promise<CombinedKataDetail>} - kataData with formatted code & test block strings for HASH COMMENT languages
 */
async function hashCommentPreprocess(combinedKataDetail: CombinedKataDetail): Promise<CombinedKataDetail> {
  // TEST STRING - Reformat export, imports & test config for local use
  // Remove initial any default comment block
  combinedKataDetail.tests = combinedKataDetail?.tests.replace(
    /^#(?:.|[\n\r\u2028\u2029#])*?(?=[\w`'"]{2,})(?<=[\n\r\u2028\u2029#])/,
    "",
  )
  // Remove any trailing default comment block
  combinedKataDetail.tests = combinedKataDetail?.tests.replace(
    /(?<=.\n|\r|\u2028|\u2029)(?:#.*|\n|\r|\u2028|\u2029)*(?=$)/,
    "",
  )
  return combinedKataDetail
}

/**
 * ? COMMON to all HASH COMMENT languages
 * Return formatted header on code & test strings for HASH COMMENT languages
 * @param {CombinedKataDetail} preProcessedKata - {CombinedKataDetail} - kataData with formatted code & test block strings for HASH COMMENT languages
 * @returns {Promise<CombinedKataDetail>} - kataData with formatted code & test block strings with formatted header for HASH COMMENT languages
 */
async function hashCommentReturn(preProcessedKata: CombinedKataDetail): Promise<CombinedKataDetail> {
  // Return formatted header & reconfigured CODE || TEST strings for HASH COMMENT languages
  const codeBlockStrings = ["code", "test"].map(
    (flag) =>
      `# + ${"=".repeat(116)}\n# +\n# + ${preProcessedKata?.rank
        ?.name} - ${preProcessedKata?.name}  [ ID: ${preProcessedKata?.id} ] (${preProcessedKata?.slug})\n# + URL: ${
        preProcessedKata.url
      }\n# + Category: ${preProcessedKata?.category?.toUpperCase() || "NONE"}  |  Tags: ${
        preProcessedKata?.tags?.join(" | ").toUpperCase() || "NONE"
      }\n# +\n# + ${"=".repeat(116)}\n\n${
        (flag === "code" ? preProcessedKata?.code : preProcessedKata?.tests) || ""
      }\n`,
  )
  return { ...preProcessedKata, code: codeBlockStrings[0], tests: codeBlockStrings[1] }
}
