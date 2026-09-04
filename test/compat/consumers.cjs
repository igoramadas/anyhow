"use strict"

const assert = require("assert")
const fs = require("fs")
const os = require("os")
const path = require("path")
const {execFileSync} = require("child_process")

const root = path.join(__dirname, "..", "..")
const pkgJson = fs.readFileSync(path.join(root, "package.json"), "utf8")

const installLocalPackage = (dir) => {
    const dest = path.join(dir, "node_modules", "anyhow")
    fs.mkdirSync(dest, {recursive: true})
    fs.writeFileSync(path.join(dest, "package.json"), pkgJson)
    fs.cpSync(path.join(root, "lib"), path.join(dest, "lib"), {recursive: true})
}

const runConsumer = (kind, script) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `anyhow-${kind}-`))
    fs.writeFileSync(
        path.join(dir, "package.json"),
        JSON.stringify(
            {
                name: `anyhow-consumer-${kind}`,
                private: true,
                type: kind === "esm" ? "module" : "commonjs"
            },
            null,
            4
        )
    )
    installLocalPackage(dir)
    fs.writeFileSync(path.join(dir, "index.js"), script)
    const output = execFileSync("node", ["index.js"], {cwd: dir, encoding: "utf8"})
    assert.ok(output.includes(`${kind} consumer: ok`), output)
    console.log(output.trim())
    fs.rmSync(dir, {recursive: true, force: true})
}

runConsumer(
    "cjs",
    `
const assert = require("assert")
const logger = require("anyhow")
assert.strictEqual(typeof logger.setup, "function")
assert.strictEqual(typeof logger.info, "function")
logger.setup("none")
assert.strictEqual(logger.lib, "none")
assert.ok(String(logger.info("from-cjs-consumer")).includes("from-cjs-consumer"))
console.log("cjs consumer: ok")
`
)

runConsumer(
    "esm",
    `
import assert from "assert"
import logger from "anyhow"
assert.strictEqual(typeof logger.setup, "function")
assert.strictEqual(typeof logger.info, "function")
logger.setup("none")
assert.strictEqual(logger.lib, "none")
assert.ok(String(logger.info("from-esm-consumer")).includes("from-esm-consumer"))
console.log("esm consumer: ok")
`
)

console.log("Package export consumers: ok")
