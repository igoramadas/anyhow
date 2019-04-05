// TEST: MAIN

let capcon = require("capture-console")
let chai = require("chai")
let mocha = require("mocha")
let after = mocha.after
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Message Tests", function() {
    let anyhow = null

    before(function() {
        anyhow = require("../index")
    })

    after(function() {
        anyhow.preprocessor = null
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

    it("Uses a custom separator and do not compact", function(done) {
        anyhow.separator = "/"
        anyhow.compact = false

        let message = anyhow.getMessage("1   ", "2")

        if (message == "1   /2") {
            done()
        } else {
            done(`Expected '1   /2' as message, but got '${message}'.`)
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
