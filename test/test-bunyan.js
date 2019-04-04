// TEST: BUNYAN

let capcon = require("capture-console")
let chai = require("chai")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Bunyan Tests", function() {
    let anyhow = null

    before(function() {
        anyhow = require("../index")
    })

    it("Log using Bunyan console", function(done) {
        anyhow.setup("bunyan")

        let b = require("bunyan")
        let c = b.createLogger({
            name: "test"
        })

        let logged = capcon.captureStdout(function scope() {
            anyhow.info("Log to Bunyan")
        }).trim()

        if (logged.toString().indexOf("Log to Bunyan") > 0) {
            done()
        } else {
            done("Expected 'Log to Bunyan' on console output.")
        }
    })
})
