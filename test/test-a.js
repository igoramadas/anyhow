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

        if (!anyhow.isReady) {
            done("Calling isReady should return true")
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

    it("Transform mixed arguments into a message using getMessage()", function(done) {
        let args = [
            "Some message",
            {
                innerNumber: [1, 2, 3]
            },
            [4, 5, 6],
            new Date()
        ]

        let message = anyhow.getMessage(args, "secondArgument", {})

        if (message.indexOf("1") > 0 && message.indexOf("4") > 0 && message.indexOf("secondArgument") > 0) {
            done()
        } else {
            done("Message should have at least '1', '4' and 'secondArgument' inside.")
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

    it("Enables message preprocessor to remove properties named 'password'", function(done) {
        let obj = {
            "username": "user",
            "password": "123"
        }

        // Try first returning the arguments as a result.
        anyhow.preprocessor = function(args) {
            for (let a of args) {
                if (a && a.password) {
                    delete a.password
                }
            }

            return args
        }

        if (anyhow.getMessage(obj).indexOf("123") >= 0) {
            return done("Resulting message should not contain the password '123' (preprocessor returning a value).")
        }

        // Now without returning the arguments (it gets mutated).
        anyhow.preprocessor = function(args) {
            for (let a of args) {
                if (a && a.password) {
                    delete a.password
                }
            }
        }

        if (anyhow.getMessage(obj).indexOf("123") >= 0) {
            return done("Resulting message should not contain the password '123' (preprocessor NOT returning a value).")

        }

        anyhow.preprocessor = null

        done()
    })
})
