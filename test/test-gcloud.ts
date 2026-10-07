// TEST: GOOGLE CLOUD LOGGING

import {after, before, describe, it} from "mocha"
require("chai").should()

describe("Anyhow Google Cloud Logging Tests", function () {
    let anyhow = null
    let stdout = ""

    const env = process.env
    const defaultOptions = {
        projectId: env.GCP_TEST_PROJECT_ID,
        credentials: {
            client_email: env.GCP_TEST_EMAIL,
            private_key: (env.GCP_TEST_KEY || "").replace(/\\n/g, "\n")
        }
    }

    before(function () {
        if (!env.GCP_TEST_PROJECT_ID || !env.GCP_TEST_EMAIL || !env.GCP_TEST_KEY) {
            this.skip()
        }

        anyhow = require("../src/index")

        process.stdout.write = (function (write) {
            return function (string) {
                stdout += string
                write.apply(process.stdout, arguments)
            }
        })(process.stdout.write) as any
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
        anyhow.debug(stdout)
    })
})

describe("Anyhow Google Cloud Logging Tests (fake log instance)", function () {
    let anyhow = null

    // Fake Google Cloud log, records the written entries.
    const createLog = () => {
        const log = {writes: []} as any
        log.entry = (metadata, message) => ({metadata, message})
        log.write = (entry, options, callback) => {
            log.writes.push({entry, options})
            if (callback) callback(null)
        }
        return log
    }

    before(function () {
        anyhow = require("../src/index")
        anyhow.setOptions({levels: ["info", "warn", "error"], timestamp: false})
    })

    after(function () {
        anyhow.setup("none")
    })

    it("Write entries with the mapped severity and default write options", function () {
        const log = createLog()

        anyhow.setup({name: "gcloud", instance: log})
        anyhow.warn("Warning entry")
        anyhow.error("Error entry")

        const [warn, error] = log.writes

        if (warn.entry.metadata.severity != "WARNING" || error.entry.metadata.severity != "ERROR") {
            throw `Unexpected severities ${warn.entry.metadata.severity} and ${error.entry.metadata.severity}`
        } else if (warn.entry.message != "Warning entry") {
            throw `Unexpected message '${warn.entry.message}'.`
        } else if (warn.options.resource.type != "global" || warn.options.partialSuccess !== true) {
            throw `Unexpected default write options ${JSON.stringify(warn.options)}`
        }
    })

    it("Pass custom write options and the callback", function (done) {
        const log = createLog()
        const resource = {type: "cloud_run_revision"}
        const callback = (err) => {
            const options = log.writes[0].options

            if (err) {
                done(err)
            } else if (options.resource !== resource || options.partialSuccess !== false) {
                done(`Unexpected write options ${JSON.stringify(options)}`)
            } else {
                done()
            }
        }

        anyhow.setup({name: "gcloud", instance: log}, {resource, partialSuccess: false, callback})
        anyhow.info("Info entry")
    })

    it("Create the log using the logName option or the appName", function () {
        const appName = anyhow.options.appName
        const errors = []

        anyhow.setOptions({appName: "My Test App"})
        anyhow.setup("gcloud", {projectId: "anyhow-test"})
        errors.push(anyhow.lib)
        anyhow.setup("gcloud", {projectId: "anyhow-test", logName: "custom-log"})
        errors.push(anyhow.lib)
        anyhow.setOptions({appName})

        if (errors.join(",") != "gcloud,gcloud") {
            throw `Expected both setups to use gcloud, got ${errors.join(",")}`
        }
    })
})
