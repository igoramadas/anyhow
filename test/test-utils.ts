// TEST: UTILS

import {describe, it} from "mocha"
require("chai").should()

describe("Anyhow Utils Tests", function () {
    let {flattenArray, getTag, isError, isPlainObject} = require("../src/utils")

    it("Check identifiable errors", function (done) {
        if (isError("")) return done("String should not be identified as error.")
        if (!isError(new Error("Oops"))) return done("Instantiated Error was not identified as an error.")

        try {
            const b = {} as any
            b.c.d()
        } catch (ex) {
            if (!isError(ex)) return done("Exception was not identified as an error.")
        }

        done()
    })

    it("Flatten a deep array", function (done) {
        let array = [1, 2, [3, 4, [5]], [[[6]]], flattenArray([]), flattenArray(null)]
        let flat = flattenArray(array)

        if (flat.join(",") == "1,2,3,4,5,6") {
            done()
        } else {
            done(`Array not flattened: ${flat.join(",")}`)
        }
    })

    it("Validate a plain object", function (done) {
        let obj = {a: 1, b: 2}
        let notObj = 123

        if (!isPlainObject(obj)) {
            done("Validation for obj should have returned true.")
        } else if (isPlainObject(notObj)) {
            done("Validation for notObj should have returned false.")
        } else {
            done()
        }
    })

    it("Get tags for null and undefined", function (done) {
        let tagUndefined = getTag(done["something"])
        let tagNull = getTag(null)

        if (tagUndefined != "[object Undefined]") {
            done(`Expected [object Undefined], got ${tagUndefined}`)
        } else if (tagNull != "[object Null]") {
            done(`Expected [object Null], got ${tagNull}`)
        } else {
            done()
        }
    })
})
