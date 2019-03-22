// TEST: MAIN

let fs = require("fs")
let chai = require("chai")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("JAUL IO Tests", function() {
    let anyhow = null

    before(function() {
        anyhow = require("../index")
    })

    it("Logs info based on simple arguments", function(done) {
        let someString = "This is a string"
        let someNumber = 123
        let someBool = true

        let message = anyhow.info(someString, someNumber, someBool)
        done()
    })
})
