// TEST: BUNYAN

let capcon = require("capture-console")
let chai = require("chai")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Bunyan Tests", function () {
    let anyhow = null

    before(function () {
        anyhow = require("../lib/index")
    })

    it("Log using default auto-generated Bunyan logger", function (done) {
        anyhow.setup("bunyan")

        let logged = capcon
            .captureStdout(function scope() {
                anyhow.info("Log to Bunyan")
            })
            .trim()

        if (logged.toString().indexOf("Log to Bunyan") > 0) {
            done()
        } else {
            done("Expected 'Log to Bunyan' on console output.")
        }
    })

    it("Pass custom options to Bunyan", function () {
        anyhow.setup("bunyan", {
            name: "MyApp"
        })
    })

    it("Log passing Bunyan logger directly", function (done) {
        let logger = require("bunyan").createLogger({
            name: "test"
        })

        anyhow.setup({name: "bunyan", instance: logger})

        let logged = capcon
            .captureStdout(function scope() {
                anyhow.info("Log to custom Bunyan")
            })
            .trim()

        if (logged.toString().indexOf("Log to custom Bunyan") > 0) {
            done()
        } else {
            done("Expected 'Log to custom Bunyan' on console output.")
        }
    })
})
