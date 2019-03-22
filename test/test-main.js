// TEST: MAIN

let fs = require("fs")
let chai = require("chai")
let mocha = require("mocha")
let npm = require("npm")
let after = mocha.after
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Tests", function() {
    let anyhow = null

    before(function() {
        anyhow = require("../index")
    })

    after(function() {
        let callback = function(err) {
            npm.commands.uninstall(["winston"], function() {})
        }

        npm.load(callback)
    })

    it("Logs info based on simple arguments", function(done) {
        let someString = "This is a string"
        let someNumber = 123
        let someBool = true

        let message = anyhow.info(someString, someNumber, someBool)
        done()
    })

    it("Logs using Winston", function(done) {
        this.timeout(30000)

        let callback = function(err) {
            npm.commands.install(["winston"], function(ex, data) {
                if (ex) {
                    return done("Could not install Winston.")
                }

                anyhow.setup()
                let message = anyhow.info("Logged via Winston")
                done()
            })
        }

        npm.load(callback);
    })
})
