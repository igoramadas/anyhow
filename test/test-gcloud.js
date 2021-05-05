// TEST: GOOGLE CLOUD LOGGING

let chai = require("chai")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Anyhow Google Cloud Logging Tests", function () {
    let anyhow = null
    let stdout = ""

    const env = process.env
    const defaultOptions = {
        projectId: env.GCP_TEST_PROJECT_ID,
        credentials: {
            client_email: env.GCP_TEST_EMAIL,
            private_key: env.GCP_TEST_KEY.replace(/\\n/g, "\n")
        }
    }

    before(function () {
        anyhow = require("../lib/index")

        process.stdout.write = (function (write) {
            return function (string) {
                stdout += string
                write.apply(process.stdout, arguments)
            }
        })(process.stdout.write)
    })

    it("Log using default auto-generated GCloud logger", function (done) {
        let counter = 0
        let options = JSON.parse(JSON.stringify(defaultOptions, null, 0))

        options.callback = (err) => {
            counter++

            if (counter == 3) {
                if (err) {
                    done(err)
                } else {
                    done()
                }
            }
        }

        anyhow.setup("gcloud", options)

        anyhow.info("Testing info log", 123, new Date())
        anyhow.warn("This is a warning")
        anyhow.error(new Error("This is an error"))
    })

    it("Log passing GCloud logger directly", function (done) {
        let finished = false
        let options = JSON.parse(JSON.stringify(defaultOptions, null, 0))

        options.partialSuccess = true
        options.logName = "anyhow-testing"

        options.callback = (err) => {
            if (finished) return
            finished = true

            if (err) {
                done(err)
            } else {
                done()
            }
        }

        let gcloudModule = require("@google-cloud/logging")
        let logging = new gcloudModule.Logging(options)
        let logger = logging.log("anyhow-testing")

        anyhow.setup({name: "gcloud", instance: logger}, options)
        anyhow.info("Log to custom GCloud")
    })
})
