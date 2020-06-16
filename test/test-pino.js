// TEST: PINO

let chai = require("chai")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Pino Tests", function () {
    let anyhow = null
    let stdout = ""

    before(function () {
        anyhow = require("../lib/index")

        process.stdout.write = (function (write) {
            return function (string) {
                stdout += string
                write.apply(process.stdout, arguments)
            }
        })(process.stdout.write)
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
