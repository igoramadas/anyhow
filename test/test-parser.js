// TEST: MAIN

let axios = require("axios")
let crypto = require("crypto")
let chai = require("chai")
let mocha = require("mocha")
let after = mocha.after
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Message Tests", function () {
    let anyhow = null
    let parser = null

    before(function () {
        anyhow = require("../lib/index")
        parser = require("../lib/parser")

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
        let message = parser.getMessage(["Should have a timestamp"])
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
        anyhow.setOptions({compact: false, preprocessors: ["cleanup"]})

        function aClass() {}
        const instance = new aClass()

        let arr = [
            instance,
            new Date(),
            null,
            {
                someFunc: function lalala() {}
            },
            {
                obj: {
                    func: (a) => a,
                    test: "test",
                    arrays: [2, [3, [4, [5]]]],
                    level1: {
                        level2: {
                            level3: {
                                level4: {
                                    level5: "level5"
                                }
                            }
                        }
                    }
                }
            },
            [1, [{anotherArray: new Date()}]],
            (arrFunc) => arrFunc,
            function anotherFunc() {}
        ]

        let message = parser.getMessage(arr)
        anyhow.setOptions({compact: true, preprocessors: null})

        if (message.includes("level5")) {
            done("Message should have stopped before level 5")
        } else if (!message.includes("[Function]")) {
            done("Functions should be replaced with the string [Function]")
        } else {
            done()
        }
    })

    it("Use the 'friendlyErrors' preprocessor", async function () {
        this.timeout(10000)

        anyhow.setOptions({preprocessors: ["friendlyErrors"]})

        let noEx = {error: false}

        let customEx = new Error("Custom")
        delete customEx.message
        customEx.description = "my error"

        let message = null
        let axiosEx

        try {
            await axios.get("https://google.com/page/that/does/not-exist")
        } catch (ex) {
            axiosEx = ex
        }

        try {
            throw new Error("This is an error")
        } catch (ex) {
            ex.friendlyMessage = "This is a friendly message"
            ex.reason = "This is a reason"
            ex.code = 500

            message = parser.getMessage([ex, customEx, noEx, [axiosEx]])
        }

        anyhow.setOptions({preprocessors: null})

        if (!message.includes("500") || !message.includes("error") || !message.includes(".js")) {
            throw `Expected at least '500', 'error' and the stack trace inside the message, but got ${message}`
        }
    })

    it("Use the 'maskSecrets' preprocessor", function (done) {
        anyhow.setOptions({compact: false, preprocessors: ["maskSecrets"]})

        let obj1 = {
            accessToken: "mytoken",
            name: "User",
            inner: {
                password: "mypass"
            },
            empty: []
        }

        let obj2 = [{password: "mypass", anotherArray: [[1, [2]]]}]

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
                    accessToken: "a12b3c"
                }

                obj.level1.circular = obj

                arr.push(obj)
            }

            for (let i = 0; i < 50; i++) {
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

        const tLast = performance.now()

        anyhow.setOptions({preprocessorOptions: {clone: true}})
        parser.getMessage(arr3)

        const tEnd = performance.now()

        console.log(`Parsing without preprocessors: ${Math.floor(tMid - tStart)}ms`)
        console.log(`Parsing preprocessors without clone: ${Math.floor(tLast - tMid)}ms`)
        console.log(`Parsing preprocessors with clone: ${Math.floor(tEnd - tLast)}ms`)
    })
})
