import assert from "node:assert/strict"
import {createRequire} from "node:module"
import anyhow from "anyhow"

const require = createRequire(import.meta.url)

assert.strictEqual(anyhow, require("anyhow"))
anyhow.setup("none")
assert.equal(anyhow.isReady, true)
