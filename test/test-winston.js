// TEST: WINSTON

let capcon = require("capture-console")
let chai = require("chai")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Winston Tests", function() {
    let anyhow = null

    before(function() {
        anyhow = require("../index")
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
})
