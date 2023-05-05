// TEST: PINO

import {before, describe, it} from "mocha"
require("chai").should()

describe("Anyhow Pino Tests", function () {
    let anyhow = null
    let stdout = ""

    before(function () {
        anyhow = require("../src/index")

        process.stdout.write = (function (write) {
            return function (string) {
                stdout += string
                write.apply(process.stdout, arguments)
            }
        })(process.stdout.write) as any
    })

    it("Log using default auto-generated Pino logger", function (done) {
        anyhow.setup("pino")
        anyhow.info("Log to Pino")

        if (stdout.indexOf("Log to Pino") > 0) {
            done()
        } else {
            done("Expected 'Log to Pino' on console output.")
        }
    })

    it("Pass custom options to Pino", function () {
        anyhow.setup("pino", {
            name: "MyApp"
        })
    })

    it("Log passing Pino logger directly", function (done) {
        let logger = require("pino")()

        anyhow.setup({name: "pino", instance: logger})
        anyhow.info("Log to custom Pino")

        if (stdout.indexOf("Log to custom Pino") < 0) {
            done("Expected 'Log to custom Pino' on console output.")
        } else if (anyhow.lib != "pino") {
            done(`The .lib property should be 'pino', but got: ${anyhow.lib}`)
        } else {
            done()
        }
    })
})
