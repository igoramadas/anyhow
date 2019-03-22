// TEST: MAIN

let capcon = require("capture-console")
let chai = require("chai")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Tests", function() {
    let anyhow = null

    before(function() {
        anyhow = require("../index")
    })

    it("Log info to console based on simple arguments", function(done) {
        anyhow.setup("console")

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

    it("Log debug, warn, error", function(done) {
        let logged = capcon.captureStdout(function scope() {
            anyhow.debug("Test log debug")
            anyhow.warn("Test log warn")
            anyhow.error("Test log error")
        }).toString()

        if (logged.indexOf("debug") > 0 && logged.indexOf("warn") && logged.indexOf("error")) {
            done()
        } else {
            done("Expected 'debug', 'warn' and 'error' on console.")
        }
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

    it("Log using Winston console", function(done) {
        anyhow.setup("winston")

        let winston = require("winston")
        winston.add(new winston.transports.Console())

        let logged = capcon.captureStdout(function scope() {
            anyhow.info("Log to Winston")
        }).trim()

        let expected = '{"level":"info","message":"Log to Winston"}'

        if (expected == logged) {
            done()
        } else {
            done(`Expected '${expected}' but got '${logged}' on console.`)
        }
    })

    it("Log using Winston console", function(done) {
        anyhow.setup("winston")

        let winston = require("winston")
        winston.add(new winston.transports.Console())

        let logged = capcon.captureStdout(function scope() {
            anyhow.info("Log to Winston")
        }).trim()

        let expected = '{"level":"info","message":"Log to Winston"}'

        if (logged.indexOf("level") > 0 && logged.indexOf("Winston") > 0) {
            done()
        } else {
            done(`Expected '${expected}' but got '${logged}' on console.`)
        }
    })

    it("Transform mixed arguments into a message using getMessage()", function(done) {
        let args = [
            "Some message",
            {
                innerNumber: [1, 2, 3]
            },
            [4, 5, 6],
            new Date()
        ]

        let message = anyhow.getMessage(args)

        if (message.indexOf("1") > 0 && message.indexOf("4") > 0) {
            done()
        } else {
            done("Message should have '1' and '4' inside.")
        }
    })

    it("Transform error into a message using getMessage()", function(done) {
        let expected = "This is an error"
        let message = null

        try {
            throw new Error(expected)
        } catch (ex) {
            ex.friendlyMessage = "This is a friendly message"
            ex.reason = "This is a reason"
            ex.code = 500
            message = anyhow.getMessage(ex)
        }

        if (message.indexOf(expected) >= 0) {
            done()
        } else {
            done(`Expected '${expected}' inside the message.`)
        }
    })
})
