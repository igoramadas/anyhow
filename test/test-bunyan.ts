// TEST: BUNYAN

import {before, describe, it} from "mocha"
require("chai").should()

describe("Anyhow Bunyan Tests", function () {
    let capcon = require("capture-console")
    let anyhow = null

    before(function () {
        anyhow = require("../src/index")
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
