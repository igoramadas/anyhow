// TEST: UNCAUGHT EXCEPTIONS

import {before, describe, it} from "mocha"
require("chai").should()

let uncaughtProcess, uncaughtDone
let unhandledProcess, unhandledDone

let messageHandler = (message) => {
    let capcon = require("capture-console")
    let innerAnyhow = require("../src/index")
    let logged = ""

    if (message.command == "throwex") {
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
    let childProcess = require("child_process")

    if (describe) {
        describe("Anyhow Uncaught Exception Test", function () {
            let anyhow = null

            before(function () {
                anyhow = require("../src/index")
                anyhow.setup("console")
            })

            it("Catch and log uncaught exception", function (done) {
                this.timeout(5000)
                anyhow.setOptions({uncaughtExceptions: true})
                uncaughtDone = done

                uncaughtProcess = childProcess.fork("./lib-test/test/test-uncaught", {})
                uncaughtProcess.on("message", messageHandler)
                uncaughtProcess.send({
                    command: "throwex"
                })

                anyhow.setOptions({uncaughtExceptions: false})
            })

            it("Catch and log unhandled rejection", function (done) {
                this.timeout(5000)
                anyhow.setOptions({unhandledRejections: true})
                unhandledDone = done

                unhandledProcess = childProcess.fork("./lib-test/test/test-uncaught")
                unhandledProcess.on("message", messageHandler)
                unhandledProcess.send({
                    command: "reject"
                })

                anyhow.setOptions({unhandledRejections: false})
            })
        })
    }
} catch (ex) {}
