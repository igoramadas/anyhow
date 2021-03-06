// TEST: MAIN

let capcon = require("capture-console")
let chai = require("chai")
let mocha = require("mocha")
let after = mocha.after
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Message Tests", function () {
    let anyhow = null
    let parser = null

    before(function () {
        anyhow = require("../lib/index")
        parser = require("../lib/parser")
    })

    after(function () {
        anyhow.preprocessor = null
    })

    it("Transform mixed arguments into a message using getMessage()", function (done) {
        let args = [
            "Some message",
            {
                innerNumber: [1, 2, 3]
            },
            [4, 5, 6],
            new Date()
        ]

        let message = parser.getMessage(args, "secondArgument", {})

        if (message.indexOf("1") > 0 && message.indexOf("4") > 0 && message.indexOf("secondArgument") > 0) {
            done()
        } else {
            done("Message should have at least '1', '4' and 'secondArgument' inside.")
        }
    })

    it("Transform error into a message using getMessage()", function (done) {
        let message = null

        try {
            throw new Error("This is an error")
        } catch (ex) {
            ex.friendlyMessage = "This is a friendly message"
            ex.reason = "This is a reason"
            ex.code = 500
            message = parser.getMessage(ex)
        }

        if (message.indexOf("500") >= 0 && message.indexOf("error") >= 0) {
            done()
        } else {
            done(`Expected at least '500' and 'error' inside the message, but got ${message}`)
        }
    })

    it("Include stack trace with error messages", function (done) {
        anyhow.errorStack = true

        message = parser.getMessage(new Error("With stack"))

        if (message.indexOf(".js") >= 0) {
            done()
        } else {
            done("Expected stack trace inside the message.")
        }
    })

    it("Uses a custom separator and do not compact", function (done) {
        anyhow.separator = "/"
        anyhow.compact = false

        let message = parser.getMessage("1   ", "2")

        if (message == "1   /2") {
            done()
        } else {
            done(`Expected '1   /2' as message, but got '${message}'.`)
        }
    })

    it("Append a timestamp on messages", function (done) {
        anyhow.timestamp = true
        let message = parser.getMessage("Should have a timestamp")
        anyhow.timestamp = false

        let now = new Date()
        let year = now.getUTCFullYear().toString()

        if (message.substring(0, 2) == year.substring(2)) {
            done()
        } else {
            done(`Expected year ${year.substring(2)} on the beginning of '${message}'.`)
        }
    })

    it("Enables message preprocessor to remove properties named 'password'", function (done) {
        let obj = {
            username: "user",
            password: "123"
        }

        // Try first returning the arguments as a result.
        anyhow.preprocessor = function (args) {
            for (let a of args) {
                if (a && a.password) {
                    delete a.password
                }
            }

            return args
        }

        if (parser.getMessage(obj).indexOf("123") >= 0) {
            return done("Resulting message should not contain the password '123' (preprocessor returning a value).")
        }

        // Now without returning the arguments (it gets mutated).
        anyhow.preprocessor = function (args) {
            for (let a of args) {
                if (a && a.password) {
                    delete a.password
                }
            }
        }

        if (parser.getMessage(obj).indexOf("123") >= 0) {
            return done("Resulting message should not contain the password '123' (preprocessor NOT returning a value).")
        }

        anyhow.preprocessor = null
        done()
    })
})
