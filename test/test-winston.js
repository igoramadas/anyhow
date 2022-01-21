// TEST: WINSTON

let capcon = require("capture-console")
let chai = require("chai")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Winston Tests", function () {
    let anyhow = null

    before(function () {
        anyhow = require("../lib/index")
    })

    it("Log using default auto-generated Winston logger", function (done) {
        anyhow.setup("winston")
        anyhow.setOptions({timestamp: false})

        let winston = require("winston")
        winston.add(new winston.transports.Console())

        let logged = capcon
            .captureStdout(function scope() {
                anyhow.info("Log to Winston")
            })
            .trim()

        let expected = '{"level":"info","message":"Log to Winston"}'

        if (expected == logged) {
            done()
        } else {
            done(`Expected '${expected}' but got '${logged}' on console.`)
        }
    })

    it("Log passing Winston loggger directly", function (done) {
        let winston = require("winston")
        let logger = winston.createLogger({
            level: "info",
            format: winston.format.json(),
            transports: [new winston.transports.Console()]
        })

        anyhow.setup({name: "winston", instance: logger})

        let logged = capcon
            .captureStdout(function scope() {
                anyhow.info("Log to custom Winston")
            })
            .trim()

        if (logged.indexOf("Log to custom Winston") >= 0) {
            done()
        } else {
            done("Expected to log 'Log to custom Winston' on console.")
        }
    })
})
