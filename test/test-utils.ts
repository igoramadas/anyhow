// TEST: UTILS

import {describe, it} from "mocha"
require("chai").should()

describe("Anyhow Utils Tests", function () {
    let {cloneDeep, dedupArray, flattenArray, getTag, isDate, isError, isPlainObject, mergeDeep} = require("../src/utils")

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

    it("Deep clone javascript objects", function (done) {
        let complexObj = {
            func: (a) => a,
            test: "test",
            arrays: [2, [3, [4, [5]]]],
            level1: {
                level2: {
                    level3: {
                        obj3: {},
                        arr3: [1, 2, {a: 1}],
                        date3: new Date(),
                        error3: new Error("this is an error"),
                        level4: {
                            level5: "level5"
                        }
                    }
                }
            }
        }
        let nullString: string = null
        let nullArr = []
        let nullObj = {[nullString]: null}

        cloneDeep(complexObj)
        cloneDeep(nullString)
        cloneDeep(nullArr)
        cloneDeep(nullObj)

        done()
    })

    it("Clone and flatten a deep array", function (done) {
        let array = [1, 2, [3, 4, [5]], [[[6]]], flattenArray([]), flattenArray(null)]
        let cloned = cloneDeep(array)
        let flat = flattenArray(cloned)

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

    it("Deep clone nested objects, dates and errors without sharing references", function () {
        const date = new Date(2020, 0, 1)
        const error = new Error("Oops")
        const source = {nested: {list: [{a: 1}]}, date, error}
        const cloned = cloneDeep(source)

        cloned.nested.list[0].a = 2

        if (source.nested.list[0].a != 1) {
            throw "Nested objects should not be shared with the clone."
        } else if (cloned.date === date || cloned.date.getTime() != date.getTime()) {
            throw "Dates should be copied."
        } else if (!isError(cloned.error) || cloned.error.stack != error.stack || cloned.error.message != error.message) {
            throw "Errors should keep their type, message and stack."
        } else if (JSON.stringify(cloned.error) != JSON.stringify(error)) {
            throw `Cloned errors should serialize like the source, got ${JSON.stringify(cloned.error)}`
        }
    })

    it("Keep built-ins and class instances when cloning", function () {
        class Secret {
            #value = "hidden"
            toJSON() {
                return {value: this.#value}
            }
        }
        const source = {buffer: Buffer.from("abc"), url: new URL("https://example.com/x"), map: new Map([["a", 1]]), re: /x/g, secret: new Secret()}
        const cloned = cloneDeep(source)

        if (cloned === source) {
            throw "The outer plain object should be copied."
        }

        for (const key of Object.keys(source)) {
            if (cloned[key] !== source[key]) throw `The ${key} value should be kept as is.`
        }

        if (JSON.stringify(cloned) != JSON.stringify(source)) {
            throw `The clone should serialize like the source, got ${JSON.stringify(cloned)}`
        }
    })

    it("Truncate clones at the max depth", function () {
        const cloned = cloneDeep({a: {b: {c: 1}}, list: [[1]]}, false, 2)

        if (cloned.a.b != "[...]" || cloned.list[0] != "[...]") {
            throw `Expected values at depth 2 to be truncated, got ${JSON.stringify(cloned)}`
        }
    })

    it("Log clone failures only when requested", function () {
        const capcon = require("capture-console")
        const failing = {
            get bad() {
                throw new Error("Getter failed")
            }
        }

        const silent = capcon.captureStderr(() => cloneDeep(failing))
        const logged = capcon.captureStderr(() => cloneDeep(failing, true))

        if (silent.includes("Failed to clone")) {
            throw "Clone failures should not be logged by default."
        } else if (!logged.includes("Failed to clone object")) {
            throw "Clone failures should be logged when logErrors is set."
        }
    })

    it("Deduplicate arrays", function () {
        if (dedupArray([1, 1, 2]).join(",") != "1,2") throw "Duplicate values should be removed."
        if (dedupArray([]).length != 0 || dedupArray(null) !== null) throw "Empty and null arrays should be returned as they are."
    })

    it("Flatten arrays to a given depth", function () {
        const flat = flattenArray([1, [2, [3]]], 1)

        if (JSON.stringify(flat) != "[1,2,[3]]") {
            throw `Expected only one level to be flattened, got ${JSON.stringify(flat)}`
        }
    })

    it("Handle objects without a prototype and falsy dates", function () {
        const bare = Object.create(null)

        if (getTag(bare) != "[object Object]") throw `Unexpected tag ${getTag(bare)}`
        if (!isPlainObject(bare)) throw "An object without a prototype is a plain object."
        if (isDate(null)) throw "Null is not a date."
    })

    it("Merge objects deeply, optionally concatenating arrays", function () {
        const merged = mergeDeep({a: [1], b: {c: 1}}, {a: [2], b: {d: 2}})
        const concatenated = mergeDeep({a: [1]}, {a: [2]}, true)

        if (JSON.stringify(merged) != '{"a":[2],"b":{"c":1,"d":2}}') {
            throw `Unexpected merge result ${JSON.stringify(merged)}`
        } else if (concatenated.a.join(",") != "1,2") {
            throw `Arrays should be concatenated, got ${concatenated.a}`
        }
    })
})
