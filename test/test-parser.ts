// TEST: MAIN

import crypto from "crypto"
import {after, before, describe, it} from "mocha"
require("chai").should()

describe("Anyhow Parser Tests", function () {
    let axios = require("axios")
    let bent = require("bent")
    let anyhow = null
    let parser = null

    before(function () {
        anyhow = require("../src/index")
        parser = require("../src/parser")

        anyhow.setOptions({
            compact: true,
            levels: ["debug", "info", "warn", "error"],
            preprocessorOptions: {
                errorStack: true,
                maskedFields: anyhow.options.preprocessorOptions.maskedFields,
                clone: true
            }
        })
    })

    after(function () {
        anyhow.setOptions({preprocessors: null})
    })

    it("Transform mixed arguments into a message using getMessage()", function (done) {
        anyhow.setOptions({timestamp: true})

        let args = [
            "Some message",
            {
                innerNumber: [1, 2, 3]
            },
            [4, 5, 6],
            [[(1)[2]]],
            new Date()
        ]

        let message = parser.getMessage([args, "secondArgument", {}])
        anyhow.setOptions({timestamp: false})

        if (parser.getMessage().length > 0) {
            done("Empty getMessage() should return no message")
        } else if (message.indexOf("1") > 0 && message.indexOf("4") > 0 && message.indexOf("secondArgument") > 0) {
            done()
        } else {
            done("Message should have at least '1', '4' and 'secondArgument' inside.")
        }
    })

    it("Uses a custom separator and do not compact", function (done) {
        anyhow.setOptions({separator: "/", compact: false})

        let message = parser.getMessage(["1   ", "2"])

        if (message == "1   /2") {
            done()
        } else {
            done(`Expected '1   /2' as message, but got '${message}'.`)
        }

        anyhow.setOptions({separator: " | ", compact: true})
    })

    it("Append a timestamp on messages", function (done) {
        anyhow.setOptions({timestamp: true})
        let message = anyhow.info("Should have a timestamp")
        anyhow.setOptions({timestamp: false})

        let now = new Date()
        let year = now.getUTCFullYear().toString()

        if (message.substring(0, 2) == year.substring(2)) {
            done()
        } else {
            done(`Expected year ${year.substring(2)} on the beginning of '${message}'.`)
        }
    })

    it("Use the 'cleanup' preprocessor", function (done) {
        anyhow.setOptions({compact: false, preprocessors: ["cleanup"], maxDepth: 2})

        function aClass() {}
        const instance = new aClass()

        let obj = {
            func: (a) => a,
            test: "test",
            arrays: [2, [3, [4, [5]]]],
            level1: {
                level2: {
                    level3: [1, 2, 3]
                }
            },
            date1: new Date(),
            function1: function () {
                return null
            }
        }

        let arr = [
            instance,
            new Date(),
            null,
            {
                someFunc: function lalala() {}
            },
            {
                aaa: {
                    func: (a) => a,
                    test: "test",
                    arrays: [2, [3, [4, [5]]]],
                    level1: {
                        level2: {
                            level3: "level3"
                        }
                    }
                }
            },
            [1, [{anotherArray: new Date()}]],
            (arrFunc) => arrFunc,
            function anotherFunc() {}
        ]

        let cleanObj = parser.getMessage(obj)
        let cleanArray = parser.getMessage(arr)

        if (!cleanObj.includes("[...]")) {
            done("Message should have the [...] replaced array string")
        } else if (cleanArray.includes("level3")) {
            done("Message should have stopped before level 3")
        } else if (!cleanArray.includes("[Function]")) {
            done("Functions should be replaced with the string [Function]")
        } else {
            done()
        }

        anyhow.setOptions({compact: true, preprocessors: null, maxDepth: 10})
    })

    it("Use the 'friendlyErrors' preprocessor", async function () {
        this.timeout(10000)

        anyhow.setOptions({preprocessors: ["friendlyErrors"]})

        let noEx = {error: false}
        let message = null
        let simpleEx
        let axiosEx
        let bentEx

        try {
            throw new Error("This is an error")
        } catch (ex) {
            ex.friendlyMessage = "This is a friendly message"
            ex.reason = "This is a reason"
            ex.code = 500
            simpleEx = ex
        }

        try {
            await axios.get("https://google.com/page/that/does/not-exist")
        } catch (ex) {
            axiosEx = ex
        }

        try {
            const getJson = bent("json")
            await getJson("https://google.com/page/that/does/also-not-exist")
        } catch (ex) {
            bentEx = ex
        }

        let customEx = new Error("Custom")
        delete customEx.message
        customEx["description"] = "my error"

        message = parser.getMessage([noEx, simpleEx, , axiosEx, bentEx, customEx])

        if (!message.includes("500") || !message.includes("error") || !message.includes(".js")) {
            throw `Expected at least '500', 'error' and the stack trace inside the message, but got ${message}`
        }

        try {
            const err = new Error("That failed") as any
            err.response = {data: {error: "Something went wrong"}}
            throw err
        } catch (ex) {
            anyhow.error(ex)
        }

        try {
            const err = new Error("That failed") as any
            err.response = {data: {message: "Something went wrong"}}
            throw err
        } catch (ex) {
            anyhow.error(ex)
        }

        try {
            throw {message: "Some error here", errors: [{description: "Failed to do something"}]}
        } catch (ex) {
            anyhow.error(ex)
        }

        anyhow.setOptions({preprocessors: null})
    })

    it("Use the 'friendlyErrors' preprocessor with fetch() failures", function () {
        anyhow.setOptions({preprocessors: ["friendlyErrors"], preprocessorOptions: {errorStack: false}})

        const cause = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:9"), {code: "ECONNREFUSED"})
        const networkMessage = parser.getMessage([new TypeError("fetch failed", {cause})])
        const responseMessage = parser.getMessage([new Response(null, {status: 401, statusText: "Unauthorized"})])

        anyhow.setOptions({preprocessors: null, preprocessorOptions: {errorStack: true}})

        if (networkMessage != "fetch failed | connect ECONNREFUSED 127.0.0.1:9") {
            throw `Expected the network failure cause, got '${networkMessage}'.`
        } else if (responseMessage != "Code 401 | Unauthorized") {
            throw `Expected the response status, got '${responseMessage}'.`
        }
    })

    it("Use the 'maskSecrets' preprocessor", function (done) {
        anyhow.setOptions({compact: false, preprocessors: ["maskSecrets"]})

        let obj1 = {
            access_Token: "mytoken",
            name: "User",
            inner: {
                PassWord: "mypass"
            },
            empty: []
        }

        let obj2 = [{Token: "mytoken", password: "mypass", anotherArray: [[1, [2]]]}, null]

        let message = parser.getMessage([obj1, obj2])
        anyhow.setOptions({compact: true, preprocessors: null})

        if (message.includes("mypass") || message.includes("mytoken")) {
            done("The values 'mypass' and 'mytoken' should be masked, but weren't.")
        } else {
            done()
        }
    })

    it("Use a custom preprocessor to remove properties named 'testing'", function (done) {
        let obj = {
            username: "user",
            testing: "123"
        }

        anyhow.setOptions({
            preprocessors: [
                function (args) {
                    for (let a of args) {
                        if (a && a.testing) {
                            delete a.testing
                        }
                    }

                    return args
                }
            ]
        })

        if (parser.getMessage([obj]).indexOf("123") >= 0) {
            return done("Resulting message should not contain the testing '123' (preprocessor returning a value).")
        }
        anyhow.setOptions({preprocessors: null})
        done()
    })

    it("Using the 'clone' option should prevent object mutation", function (done) {
        anyhow.options.preprocessorOptions.clone = true
        anyhow.setOptions({preprocessors: ["maskSecrets"]})

        let obj = {
            token: 123
        }

        parser.getMessage([obj])

        anyhow.options.preprocessorOptions.clone = false
        anyhow.setOptions({preprocessors: null})

        if (obj.token != 123) {
            done("The obj.token should not have been masked")
        } else {
            done()
        }
    })

    it("Gracefully ignore invalid preprocessors", function (done) {
        anyhow.setOptions({
            preprocessors: [
                123,
                (a) => {
                    throw new Error(a)
                }
            ]
        })

        parser.getMessage([{testing: true}])
        anyhow.setOptions({preprocessors: null})

        done()
    })

    it("Mask secrets when other preprocessors are ignored, as on info logs", function () {
        anyhow.setOptions({preprocessors: ["friendlyErrors", "maskSecrets"]})
        const message = parser.getMessage([{password: "secret", errors: [{description: "Kept as JSON"}]}], ["friendlyErrors"])
        anyhow.setOptions({preprocessors: null})

        if (message.includes("secret") || !message.includes("[***]")) {
            throw `Expected the password to be masked, got '${message}'.`
        } else if (!message.includes('"errors"')) {
            throw `Expected friendlyErrors to be skipped, got '${message}'.`
        }
    })

    it("Masking with the 'clone' option does not change nested objects", function () {
        anyhow.setOptions({preprocessors: ["maskSecrets"], preprocessorOptions: {clone: true}})
        const user = {name: "joe", auth: {token: "abc123"}, keys: [{apiKey: "k1"}]}
        const message = parser.getMessage([user])
        anyhow.setOptions({preprocessors: null})

        if (message.includes("abc123") || message.includes("k1")) {
            throw `Expected nested secrets to be masked, got '${message}'.`
        } else if (user.auth.token != "abc123" || user.keys[0].apiKey != "k1") {
            throw "The logged object should not have been changed."
        }
    })

    it("Use the 'cleanup' preprocessor on nested functions and dates", function () {
        anyhow.setOptions({preprocessors: ["cleanup"]})
        const date = new Date(2020, 0, 2)
        const message = parser.getMessage([{handler: () => true, created: date}, date])
        anyhow.setOptions({preprocessors: null})

        if (!message.includes('"handler": "[Function]"')) {
            throw `Expected nested functions to be replaced, got '${message}'.`
        } else if (!message.includes(`"created": "${date.toLocaleString()}"`) || !message.endsWith(date.toLocaleString())) {
            throw `Expected dates to be formatted, got '${message}'.`
        }
    })

    it("Use the 'friendlyErrors' preprocessor with nested errors and string causes", function () {
        anyhow.setOptions({preprocessors: ["friendlyErrors"], preprocessorOptions: {errorStack: false}})
        const aggregateMessage = parser.getMessage([new AggregateError([new Error("First failed"), "Second failed"], "All failed")])
        const causeMessage = parser.getMessage([new Error("Outer", {cause: "Inner reason"})])
        anyhow.setOptions({preprocessors: null, preprocessorOptions: {errorStack: true}})

        if (aggregateMessage != "All failed | First failed | Second failed") {
            throw `Expected the nested error messages, got '${aggregateMessage}'.`
        } else if (causeMessage != "Outer | Inner reason") {
            throw `Expected the string cause, got '${causeMessage}'.`
        }
    })

    it("Keep the arguments when a custom preprocessor returns nothing", function () {
        anyhow.setOptions({
            preprocessors: [
                (args) => {
                    args[0].touched = true
                }
            ]
        })
        const message = parser.getMessage([{a: 1}])
        anyhow.setOptions({preprocessors: null})

        if (message != '{ "a": 1, "touched": true}') {
            throw `Unexpected message '${message}'.`
        }
    })

    it("Report parsing failures to stderr when debug is enabled", function () {
        const capcon = require("./capture")
        const circular = Object.create(null)
        circular.self = circular
        const failing = {
            get response() {
                throw new Error("Getter failed")
            }
        }
        let message

        const logged = capcon.captureStderr(() => {
            message = parser.getMessage([circular, "ok"])
            anyhow.setOptions({preprocessors: ["friendlyErrors"]})
            parser.getMessage([failing])
            anyhow.setOptions({preprocessors: null})
        })

        if (message != "ok") {
            throw `Unparseable arguments should be skipped, got '${message}'.`
        } else if (!logged.includes("failed to parse arguments") || !logged.includes("failed to generate message")) {
            throw `Expected both failures on stderr, got '${logged}'.`
        }
    })

    it("Format debug JSON with indentation when not compacting", function () {
        anyhow.setOptions({compact: false})
        const message = parser.getDebugMessage([{a: 1}])
        anyhow.setOptions({compact: true})

        if (message != JSON.stringify({a: 1}, null, 2)) {
            throw `Unexpected debug message '${message}'.`
        }
    })

    it("Inspect objects without a constructor", function () {
        const message = parser.getInspection([Object.create(null)])

        if (!message.startsWith("Object\n------")) {
            throw `Unexpected inspection '${message}'.`
        }
    })

    it("Reset preprocessors when the parser options have none", function () {
        anyhow.setOptions({preprocessors: ["maskSecrets"]})
        parser.options = {...anyhow.options, preprocessors: undefined}
        const message = parser.getMessage([{password: "visible"}])
        anyhow.setOptions({preprocessors: null})

        if (!message.includes("visible")) {
            throw `Expected no preprocessors to run, got '${message}'.`
        }
    })

    it("Benchmark parsing: preprocessors disabled, enabled without clone, enabled with clone", async function () {
        this.timeout(20000)

        const randomString = () => crypto.randomBytes(Math.floor(Math.random() * 30) + 1).toString("hex")
        const arr1 = []
        const arr2 = []
        const arr3 = []

        for (let arr of [arr1, arr2, arr3]) {
            for (let i = 0; i < 1000; i++) {
                const obj = {
                    level1: {
                        level2: {
                            someDate: new Date(),
                            level3: {
                                level4: {
                                    level5: {
                                        password: "123",
                                        token: "abc",
                                        hello: {
                                            a: "there"
                                        },
                                        func: (a) => a
                                    }
                                }
                            },
                            func: function (b) {
                                return b
                            }
                        },
                        empty: {}
                    },
                    accessToken: "a12b3c",
                    function(x) {
                        return x
                    }
                }

                obj.level1["circular"] = obj

                arr.push(obj)
            }

            for (let i = 0; i < 100; i++) {
                arr.push(new Error(randomString()))
            }

            for (let i = 0; i < 2; i++) {
                try {
                    await axios.get(`https://google.com/invalid-path/${randomString()}`)
                } catch (ex) {
                    arr.push(ex)
                }
            }
        }

        const tStart = performance.now()

        anyhow.options.preprocessors = null
        parser.getMessage(arr1)

        const tMid = performance.now()

        anyhow.setOptions({preprocessors: ["cleanup", "friendlyErrors", "maskSecrets"], preprocessorOptions: {clone: false}})
        parser.getMessage(arr2)
        parser.getMessage(1)
        parser.getMessage("a")
        parser.getMessage(new Date())
        parser.getMessage(function (a) {
            return a
        })

        const tLast = performance.now()

        anyhow.setOptions({preprocessorOptions: {clone: true}})
        parser.getMessage(arr3)

        const tEnd = performance.now()

        console.log(`Parsing without preprocessors: ${Math.floor(tMid - tStart)}ms`)
        console.log(`Parsing preprocessors without clone: ${Math.floor(tLast - tMid)}ms`)
        console.log(`Parsing preprocessors with clone: ${Math.floor(tEnd - tLast)}ms`)
    })
})
