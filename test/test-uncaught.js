// TEST: UNCAUGHT EXCEPTIONS

let capcon = require("capture-console")
let chai = require("chai")
let childProcess = require("child_process")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it
let uncaughtProcess
let uncaughtDone

chai.should()

let messageHandler = message => {
    if (message.command == "throwex") {
        let innerAnyhow = require("../lib/index")
        innerAnyhow.setup("console")
        innerAnyhow.uncaughtExceptions = true

        let logged = ""

        capcon.startCapture(process.stderr, function(stdout) {
            logged += stdout;
        })

        let callback = () => {
            capcon.stopCapture(process.stderr)
            innerAnyhow.uncaughtExceptions = false

            process.send({
                finished: logged
            })
        }

        setTimeout(callback, 300)
        throw new Error()
    } else if (message.finished) {
        if (message.finished.indexOf("Uncaught exception") >= 0) {
            uncaughtDone()
        } else {
            uncaughtDone("Console message should have 'Unhanlded exception'.")
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
    })
}
