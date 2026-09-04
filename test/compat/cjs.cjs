"use strict"

const assert = require("assert")
const logger = require("../../lib/cjs/index.js")

assert.strictEqual(typeof logger.setup, "function", "CJS require() should return the logger instance")
assert.strictEqual(typeof logger.info, "function", "CJS logger.info should be a function")
assert.strictEqual(logger.default, undefined, "CJS require() should not wrap the instance as { default }")

logger.setup("none")
assert.strictEqual(logger.lib, "none")
assert.ok(String(logger.info("hello-cjs")).includes("hello-cjs"))

logger.setup("console")
assert.strictEqual(logger.lib, "console")
logger.setOptions({timestamp: false})
assert.strictEqual(logger.info("hello-cjs-console"), "hello-cjs-console")

logger.setup("winston")
assert.strictEqual(logger.lib, "winston")

console.log("CJS compatibility: ok")
