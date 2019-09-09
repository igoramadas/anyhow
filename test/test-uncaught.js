// TEST: UNCAUGHT EXCEPTIONS

let capcon = require("capture-console")
let chai = require("chai")
let childProcess = require("child_process")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it
let uncaughtProcess, uncaughtDone
let unhandledProcess, unhandledDone

chai.should()

let messageHandler = message => {
    let logged = ""

    if (message.command == "throwex") {
        let innerAnyhow = require("../lib/index")
        innerAnyhow.setup("console")
        innerAnyhow.uncaughtExceptions = true

        capcon.startCapture(process.stderr, function(stdout) {
            logged += stdout
        })

        let callback = () => {
            capcon.stopCapture(process.stderr)
            innerAnyhow.uncaughtExceptions = false

            process.send({
                uncaughtFinished: logged
            })
        }

        setTimeout(callback, 300)
        throw new Error()
    } else if (message.command == "reject") {
        let innerAnyhow = require("../lib/index")
        innerAnyhow.setup("console")
        innerAnyhow.unhandledRejections = true

        capcon.startCapture(process.stderr, function(stdout) {
            logged += stdout
        })

        let callback = () => {
            capcon.stopCapture(process.stderr)
            innerAnyhow.uncaughtExceptions = false

            process.send({
                unhandledFinished: logged
            })
        }

        let asyncFunc = async function() {
            throw new Error()
        }

        setTimeout(callback, 300)
        asyncFunc()
    } else if (message.uncaughtFinished) {
        if (message.uncaughtFinished.indexOf("Uncaught exception") >= 0) {
            uncaughtDone()
        } else {
            uncaughtDone("Console message should have 'Uncaught exception'.")
        }
    } else if (message.unhandledFinished) {
        if (message.unhandledFinished.indexOf("Unhandled rejection") >= 0) {
            unhandledDone()
        } else {
            unhandledDone("Console message should have 'Unhanlded rejection'.")
        }
    }
}

process.on("message", messageHandler)

if (describe) {
    describe("Anyhow Uncaught Exception Test", function() {
        let anyhow = null

        before(function() {
            anyhow = require("../lib/index")
            anyhow.setup("console")
        })

        it("Catch and log uncaught exception", function(done) {
            uncaughtDone = done

            uncaughtProcess = childProcess.fork(`${__dirname}/test-uncaught.js`)
            uncaughtProcess.on("message", messageHandler)
            uncaughtProcess.send({
                command: "throwex"
            })
        })

        it("Disable catching uncaught exceptions", function(done) {
            anyhow.uncaughtExceptions = false
            anyhow.uncaughtExceptions = true

            if (anyhow.uncaughtExceptions) {
                anyhow.uncaughtExceptions = false
                done()
            } else {
                done("The uncaughtExceptions should have returned true.")
            }
        })

        it("Catch and log unhandled rejection", function(done) {
            unhandledDone = done

            unhandledProcess = childProcess.fork(`${__dirname}/test-uncaught.js`)
            unhandledProcess.on("message", messageHandler)
            unhandledProcess.send({
                command: "reject"
            })
        })

        it("Disable catching unhandled rejections", function(done) {
            anyhow.unhandledRejections = false
            anyhow.unhandledRejections = true

            if (anyhow.unhandledRejections) {
                anyhow.unhandledRejections = false
                done()
            } else {
                done("The unhandledRejections should have returned true.")
            }
        })
    })
}
