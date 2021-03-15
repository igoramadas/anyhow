// Anyhow: Setup

import {Logger} from "./types"
import {isFunction, isNil, isObject, isString} from "./utils"

/**
 * Setup will try to load compatible loggers, and fall back to the console
 * if nothing was found. Will try using libraries on this order:
 * winston, bunyan, pino, gcloud, console.
 * @param anyhow The anyhow instance.
 * @param lib Optional, force a specific library to be used.
 * @param options Additional options to be passed to the underlying logging library.
 */
export const libSetup = (anyhow, lib?: "winston" | "bunyan" | "pino" | "gcloud" | "console" | "none" | Logger, options?: any): void => {
    try {
        if (!options) options = {}

        let libObj = lib as Logger
        let found = false

        // Passed "none"? This will effectively disable logging.
        if (lib == "none") {
            anyhow._logger = {
                name: "none",
                log: function () {
                    return false
                }
            }

            return
        }

        // Passed logger object directly? Check its signature.
        if (isObject(lib)) {
            if (!libObj.name) {
                throw new Error("Passed logger has an invalid signature, must have name=string")
            }

            if (!libObj.log && !libObj.instance) {
                throw new Error("Passed logger has an invalid signature, must have either a log(level, message) or instance set")
            }

            // Passed an actual logging function? Set the logger object as stop here.
            if (isFunction(libObj.log)) {
                anyhow._logger = lib as Logger
                return
            }
        }

        // Lib was passed without a "log()" so we need to build a custom one further below.
        anyhow._logger = {
            name: libObj.name ? libObj.name : (lib as string),
            log: null
        }

        const libName = anyhow._logger.name

        // First try Winston.
        if (libName == "winston") {
            try {
                const winston = libObj.instance ? libObj.instance : require("winston")

                // Winston logger helper.
                anyhow._logger.log = function (level, message) {
                    winston.log({level: level, message: message})
                }

                found = true
            } catch (ex) {
                /* istanbul ignore next */
                console.error("Anyhow.setup", "Could not setup winston", ex)
            }
        }

        // Then Bunyan.
        else if (libName == "bunyan") {
            try {
                if (!options.name) {
                    options.name = "Anyhow"
                }

                const bunyan = libObj.instance ? libObj.instance : require("bunyan").createLogger(options)

                // Bunyan logger helper.
                anyhow._logger.log = function (level, message) {
                    bunyan[level](message)
                }

                found = true
            } catch (ex) {
                /* istanbul ignore next */
                console.error("Anyhow.setup", "Could not setup bunyan", ex)
            }
        }

        // Then Pino.
        else if (libName == "pino") {
            try {
                if (!options.name) {
                    options.name = "Anyhow"
                }

                const pino = libObj.instance ? libObj.instance : require("pino")()

                // Pino logger helper.
                anyhow._logger.log = function (level, message) {
                    pino[level](message)
                }

                found = true
            } catch (ex) {
                /* istanbul ignore next */
                console.error("Anyhow.setup", "Could not setup pino", ex)
            }
        }

        // Then Google Cloud.
        else if (libName == "gcloud") {
            try {
                let gcloud

                // Google Cloud Log object was passed, or we need to create one?
                if (libObj.instance) {
                    gcloud = libObj.instance
                } else {
                    const gcloudModule = require("@google-cloud/logging")

                    // Get log name from options.
                    const logName = options.logName || anyhow.appName ? anyhow.appName.replace(/ /g, "-").toLowerCase() : "anyhow"
                    const logging = new gcloudModule.Logging(options)
                    gcloud = logging.log(logName)
                }

                // Google Cloud logger helper.
                anyhow._logger.log = function (level, message) {
                    let severity = level.toUpperCase()

                    // Google expects WARNING instead of WARN.
                    if (severity == "WARN") {
                        severity = "WARNING"
                    }

                    const metadata = {
                        resource: {type: "global"},
                        severity: severity
                    }

                    const writeOptions = {
                        resource: options.resource || null,
                        partialSuccess: isNil(options.partialSuccess) ? true : options.partialSuccess
                    }

                    const entry = gcloud.entry(metadata, message)

                    if (isFunction(options.callback)) {
                        gcloud.write(entry, writeOptions, options.callback)
                    } else {
                        /* istanbul ignore next */
                        gcloud.write(entry, writeOptions)
                    }
                }

                found = true
            } catch (ex) {
                /* istanbul ignore next */
                console.error("Anyhow.setup", "Could not setup gcloud", ex)
            }
        }

        // No logging libraries found? Fall back to console.
        if (!found) {
            anyhow._logger = {
                name: "console",
                log: (level, message) => anyhow.console(level, message)
            }
        }
    } catch (ex) {
        /* istanbul ignore next */
        const libName = isString(lib) ? lib : (lib as Logger).name
        console.error("Anyhow.setup", `Can't setup ${libName}`, ex)
        throw ex
    }
}
