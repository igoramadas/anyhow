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

    it("Calling log() before setup() warns and defaults to console", function(done) {
        let logged = capcon.captureStdout(function scope() {
            anyhow.info("Log before setup")
        }).toString()

        if (logged.indexOf("please call") && logged.indexOf("setup")) {
            done()
        } else {
            done("Expected warning to call setup() first.")
        }
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

    it("Log warn and error as string", function(done) {
        let logged = capcon.captureStdout(function scope() {
            anyhow.warn("Test log warn")
            anyhow.error("Test log error", "With 2 arguments")
        }).toString()

        if (logged.indexOf("warn") && logged.indexOf("error")) {
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

    it("Output level to console with levelOnConsole = true", function(done) {
        anyhow.levelOnConsole = true

        let logged = capcon.captureStdout(function scope() {
            anyhow.info("Test i-n-f-o")
            anyhow.error("Test e-r-r-o-r")
        }).toString()

        if (logged.indexOf("INFO") && logged.indexOf("ERROR")) {
            done()
        } else {
            done("Expected 'INFO' and 'ERROR' console.")
        }

        anyhow.levelOnConsole = false
    })

    it("Log calls passing empty or null arguments", function() {
        anyhow.debug()
        anyhow.info()
        anyhow.warn()
        anyhow.error()
        anyhow.info([null], null, {}.invalid)
    })

    it("Direct call to anyhow.log() passing info level and a string", function(done) {
        let logged = capcon.captureStdout(function scope() {
            anyhow.log("info", "This is a info log via anyhow.log()")
        }).toString()

        if (logged.indexOf("info log") > 0) {
            done()
        } else {
            done("Expected 'info log' on console.")
        }
    })

    it("Direct call to anyhow.console() passing custom level and a string", function(done) {
        anyhow.levels.push("custom")

        let logged = capcon.captureStdout(function scope() {
            anyhow.console("custom", "This is a custom log via anyhow.console()")
        }).toString()

        if (logged.indexOf("custom log") > 0) {
            done()
        } else {
            done("Expected 'custom log' on console.")
        }
    })

    it("Change and disable console styles", function() {
        delete anyhow.styles.warn
        anyhow.warn("This should have no styles on it")

        anyhow.styles = null
        anyhow.info("Styles fully disabled")
    })

    it("Do not debug log if debug is not part of levels", function(done) {
        let message

        let logged = capcon.captureStdout(function scope() {
            message = anyhow.debug("This should not be logged")
        }).toString()

        let loggedConsole = capcon.captureStdout(function scope() {
            message = anyhow.console("debug", "This should not be logged")
        }).toString()

        if (message) {
            return done("Calling .debug should have returned null as message.")
        }

        if (logged.indexOf("should not be") > 0) {
            return done("Calling .debug should not output anything on console.")
        }

        if (loggedConsole.indexOf("should not be") > 0) {
            return done("Calling .console with debug level should not output anything.")
        }

        done()
    })

    it("Disable logging using setup() passing 'none'", function(done) {
        anyhow.setup("none")

        let logged = capcon.captureStdout(function scope() {
            anyhow.info("Nothing should be logged")
        }).trim()

        if (logged.indexOf("should") > 0) {
            done(`Nothing should be logged, but got: ${logged}`)
        } else if (anyhow.lib != null) {
            done(`The .lib property should be null, but got: ${anyhow.lib}`)
        } else {
            done()
        }
    })
})
