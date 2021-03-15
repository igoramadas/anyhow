// TEST: UTILS

let chai = require("chai")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Utils Tests", function () {
    let anyhow = null

    before(function () {
        anyhow = require("../lib/index")
    })

    it("Check identifiable errors", function (done) {
        const {isError} = require("../lib/utils")

        if (isError("")) return done("String should not be identified as error")
        if (!isError(new Error("Oops"))) return done("Instantiated Error was not identified as an error")

        try {
            const a = b.c.d
        } catch (ex) {
            if (!isError(ex)) return done("Exception was not identified as an error")
        }

        done()
    })

    it("Flatten a deep array", function (done) {
        const {flattenArray} = require("../lib/utils")

        let array = [1, 2, [3, 4, [5]], [[[6]]]]
        let flat = flattenArray(array)

        if (flat.join(",") == "1,2,3,4,5,6") {
            done()
        } else {
            done(`Array not flattened: ${flat.join(",")}`)
        }
    })
})
