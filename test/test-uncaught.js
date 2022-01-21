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

let messageHandler = (message) => {
    let logged = ""

    if (message.command == "throwex") {
        let innerAnyhow = require("../lib/index")
        innerAnyhow.setup("console")
        innerAnyhow.uncaughtExceptions = true

        capcon.startCapture(process.stderr, function (stdout) {
            logged += stdout
        })

        let callback = () => {
            capcon.stopCapture(process.stderr)
            innerAnyhow.uncaughtExceptions = false

            process.send({
                uncaughtFinished: logged
            })
        }

        setTimeout(callback, 500)
        throw new Error()
    } else if (message.command == "reject") {
        let innerAnyhow = require("../lib/index")
        innerAnyhow.setup("console")
        innerAnyhow.unhandledRejections = true
        innerAnyhow.options.appName = "My App"

        capcon.startCapture(process.stderr, function (stdout) {
            logged += stdout
        })

        let callback = () => {
            capcon.stopCapture(process.stderr)
            innerAnyhow.uncaughtExceptions = false

            process.send({
                unhandledFinished: logged
            })
        }

        let asyncFunc = async function () {
            throw new Error()
        }

        setTimeout(callback, 500)
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

try {
    if (describe) {
        describe("Anyhow Uncaught Exception Test", function () {
            let anyhow = null

            before(function () {
                anyhow = require("../lib/index")
                anyhow.setup("console")
            })

            it("Catch and log uncaught exception", function (done) {
                anyhow.setOptions({uncaughtExceptions: true})
                uncaughtDone = done

                uncaughtProcess = childProcess.fork(`${__dirname}/test-uncaught.js`, {})
                uncaughtProcess.on("message", messageHandler)
                uncaughtProcess.send({
                    command: "throwex"
                })

                anyhow.setOptions({uncaughtExceptions: false})
            })

            it("Catch and log unhandled rejection", function (done) {
                anyhow.setOptions({unhandledRejections: true})
                unhandledDone = done

                unhandledProcess = childProcess.fork(`${__dirname}/test-uncaught.js`)
                unhandledProcess.on("message", messageHandler)
                unhandledProcess.send({
                    command: "reject"
                })

                anyhow.setOptions({unhandledRejections: false})
            })
        })
    }
} catch (ex) {}
