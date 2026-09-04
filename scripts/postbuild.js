#!/usr/bin/env node
"use strict"

const fs = require("fs")
const path = require("path")

const cjsDir = path.join(__dirname, "..", "lib", "cjs")
const esmDir = path.join(__dirname, "..", "lib", "esm")

fs.writeFileSync(path.join(cjsDir, "package.json"), JSON.stringify({type: "commonjs"}, null, 4) + "\n")
fs.writeFileSync(esmDir + "/package.json", JSON.stringify({type: "module"}, null, 4) + "\n")

const addJsExtensions = (code) => {
    return code.replace(/((?:from|import)\s*\(?\s*)(["'])(\.[^"']+?)\2/g, (full, prefix, quote, spec) => {
        if (/\.(js|json|mjs|cjs|node)$/.test(spec)) {
            return full
        }
        return `${prefix}${quote}${spec}.js${quote}`
    })
}

const walk = (dir, onFile) => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walk(full, onFile)
        } else {
            onFile(full)
        }
    }
}

walk(esmDir, (file) => {
    if (!file.endsWith(".js") && !file.endsWith(".d.ts")) {
        return
    }

    let code = fs.readFileSync(file, "utf8")
    code = code.replace(/\nif \(typeof module !== ["']undefined["']\) \{\s*module\.exports = [^;]+;\s*\}\n/g, "\n")
    code = addJsExtensions(code)
    fs.writeFileSync(file, code)
})

walk(cjsDir, (file) => {
    if (!file.endsWith(".d.ts")) {
        return
    }

    let code = fs.readFileSync(file, "utf8")
    if (!code.includes("export default ")) {
        return
    }

    code = code.replace(/export default /g, "export = ")
    fs.writeFileSync(file, code)
})

console.log("Postbuild: dual package files ready")
