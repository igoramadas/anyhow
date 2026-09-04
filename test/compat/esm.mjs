import assert from "assert"
import logger from "../../lib/esm/index.js"

assert.strictEqual(typeof logger.setup, "function", "ESM import should return the logger instance")
assert.strictEqual(typeof logger.info, "function", "ESM logger.info should be a function")

logger.setup("none")
assert.strictEqual(logger.lib, "none")
assert.ok(String(logger.info("hello-esm")).includes("hello-esm"))

logger.setup("console")
assert.strictEqual(logger.lib, "console")
logger.setOptions({timestamp: false})
assert.strictEqual(logger.info("hello-esm-console"), "hello-esm-console")

logger.setup("pino")
assert.strictEqual(logger.lib, "pino")
logger.info("hello-esm-pino")

logger.setup("winston")
assert.strictEqual(logger.lib, "winston")

console.log("ESM compatibility: ok")
