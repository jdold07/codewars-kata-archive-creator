/* eslint-disable @typescript-eslint/no-explicit-any */

// Format code file template string
function formatCodeString(kata: any, lang: string) {
  console.log(`Code string for ${kata.id} in ${lang} successful`)
  if (lang === "python" || lang === "coffeescript") {
    return `# ${kata?.rank?.name} - ${kata?.name}  [ ID: ${kata?.id}  (${kata?.slug}) ]\n# URL: ${kata?.url}\n# Category: ${
      kata?.category?.toUpperCase() || "NONE"
    }  |  Tags: ${kata?.tags?.join(" | ").toUpperCase() || "NONE"}\n\n# ${"*".repeat(78)}\n\n#* My submitted Solution\n`
  } else {
    return `// ${kata?.rank?.name} - ${kata?.name}  [ ID: ${kata?.id}  (${kata?.slug}) ]\n// URL: ${
      kata?.url
    }\n// Category: ${kata?.category?.toUpperCase() || "NONE"}  |  Tags: ${
      kata?.tags?.join(" | ").toUpperCase() || "NONE"
    }\n\n// ${"*".repeat(77)}\n\n// My submitted Solution\n`
  }
}

export default formatCodeString
