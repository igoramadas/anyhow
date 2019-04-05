// TEST: MAIN

let capcon = require("capture-console")
let chai = require("chai")
let mocha = require("mocha")
let after = mocha.after
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Tests", function() {
    let anyhow = null

    before(function() {
        anyhow = require("../lib/index")
    })

    after(function() {
        anyhow.preprocessor = null
    })

    it("Checking isReady should return false before calling setup()", function(done) {
        if (anyhow.isReady) {
            done("Calling isReady should have returned false.")
        } else {
            done()
        }
    })

    it("Passing null lib should fallback to console", function(done) {
        anyhow.setup(null)

        if (!anyhow.isReady) {
            done("Calling isReady should return true.")
        } else {
            done()
        }
    })

    it("Log info to console based on simple arguments", function(done) {
        anyhow.setup("console")

        if (!anyhow.isReady) {
            done("Calling isReady should return true.")
        }

        let someString = "This is a string"
        let someNumber = 123
        let someBool = true

        let logged = capcon.captureStdout(function scope() {
            anyhow.info(someString, someNumber, someBool)
        }).toString()

        if (logged.indexOf("123") > 0) {
            done()
        } else {
            done(`Expected '${expected}' but got '${logged}' on console.`)
        }
    })

    it("Log debug, warn, error as string", function(done) {
        let logged = capcon.captureStdout(function scope() {
            anyhow.debug("Test log debug")
            anyhow.warn("Test log warn")
            anyhow.error("Test log error", "With 2 arguments")
        }).toString()

        if (logged.indexOf("debug") > 0 && logged.indexOf("warn") && logged.indexOf("error")) {
            done()
        } else {
            done("Expected 'debug', 'warn' and 'error' on console.")
        }
    })

    it("Log an exception via anyhow.log() and anyhow.console()", function(done) {
        try {
            somethingUndefined.blablabla()
            done("Call somethingUndefined.blablabla() should throw an exception.")
        } catch (ex) {
            anyhow.log("error", ex)
            anyhow.console("error", ex)
            done()
        }
    })

    it("Log calls passing empty arguments", function() {
        anyhow.debug()
        anyhow.info()
        anyhow.warn()
        anyhow.error()
    })

    it("Direct call to anyhow.log() passing debug level and a string", function(done) {
        let logged = capcon.captureStdout(function scope() {
            anyhow.log("debug", "This is a debug log via anyhow.log()")
        }).toString()

        if (logged.indexOf("debug log") > 0) {
            done()
        } else {
            done("Expected 'debug log' on console.")
        }
    })

    it("Direct call to anyhow.console() passing custom level and a string", function(done) {
        let logged = capcon.captureStdout(function scope() {
            anyhow.console("custom", "This is a custom log via anyhow.console()")
        }).toString()

        if (logged.indexOf("custom log") > 0) {
            done()
        } else {
            done("Expected 'custom log' on console.")
        }
    })

    it("Disable logging using setup() passing 'none'", function(done) {
        anyhow.setup("none")

        let logged = capcon.captureStdout(function scope() {
            anyhow.info("Nothing should be logged")
        }).trim()

        if (logged.indexOf("should") > 0) {
            done(`Nothing should be logged, but got: ${logged}`)
        } else {
            done()
        }
    })
})
