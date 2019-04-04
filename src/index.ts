/**
 * Anyhow
 */

const _ = require("lodash")

let env = process.env.NODE_ENV || "development"
let chalk = null

class Anyhow {
    private static _instance: Anyhow
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    // PROPERTIES
    // --------------------------------------------------------------------------

    /**
     * Helper to check if setup() was already called.
     */
    get isReady() {
        if (this._log) {
            return true
        }

        return false
    }

    /**
     * Default is true. Messages will be compacted (spaces and breaks removed).
     * Set to false to log original values including spaces.
     */
    compact: boolean = true

    /**
     * A function that should be called to preprocess the arguments.
     * This is useful if you wish to remove or obfuscate data before
     * generating the logging message. Must return the processed arguments
     * as a result.
     */
    preprocessor: Function

    /**
     * Set the separator between arguments when generating logging messages.
     * Default separator is a vertical line " | ".
     */
    separator: string = " | "

    /**
     * Default console logging styles to be used in case the chalk module is installed.
     */
    styles: any = {
        debug: ["gray"],
        info: ["white"],
        warn: ["yellow"],
        error: ["red", "bold"]
    }

    /**
     * Private logging function. This will be set by the constructor
     * depending on which logger library is used.
     */
    private _log: Function

    /**
     * Default logging method.
     * @param level String representing the level: error, warn, info, verbose, debug, silly
     * @param args Array of arguments to be logged.
     * @returns The generated message that was just logged.
     */
    log(level: string, args: any): string {
        let message = _.isString(args) ? args : this.getMessage(args)
        this._log(level, message)
        return message
    }

    /**
     * Shortcut to log("debug", args).
     */
    debug(...args: any[]): string {
        if (args.length < 1) return
        let params = Array.from(arguments)
        let message = this.getMessage(params)
        return this.log("debug", message)
    }

    /**
     * Shortcut to log("info", args).
     */
    info(...args: any[]): string {
        if (args.length < 1) return
        let params = Array.from(arguments)
        let message = this.getMessage(params)
        return this.log("info", message)
    }

    /**
     * Shortcut to log("warn", args).
     */
    warn(...args: any[]): string {
        if (args.length < 1) return
        let params = Array.from(arguments)
        let message = this.getMessage(params)
        return this.log("warn", message)
    }

    /**
     * Shortcut to log("error", args).
     */
    error(...args: any[]): string {
        if (args.length < 1) return
        let params = Array.from(arguments)
        let message = this.getMessage(params)
        return this.log("error", message)
    }

    /**
     * Log directly to the console. This is the default logger handler
     * in case no other compatible libraries are found.
     * @param level String representing the level: error, warn, info, debug
     * @param args Array of arguments to be logged.
     * @returns The generated message that was just logged.
     */
    console(level: string, args: any): string {
        let message = _.isString(args) ? args : this.getMessage(args)
        let styledMessage = message
        let logMethod = console.log

        // Check if console supports the passed level. Defaults to "log".
        if (console[level] && level != "debug") {
            logMethod = console[level]
        }

        // Is chalk installed? Use it to colorize the messages.
        if (chalk) {
            let styles = this.styles[level]
            let chalkStyle

            if (styles) {
                chalkStyle = chalk
                for (let s of styles) {
                    chalkStyle = chalkStyle[s]
                }
            } else {
                chalkStyle = chalk.white
            }

            styledMessage = chalkStyle(message)
        }

        logMethod(styledMessage)

        return message
    }

    /**
     * Setup will try to load compatible loggers, and fall back
     * to the console if nothing was found. You can also force
     * a specific library to be loaded passing lib = "winston|bunyan|console",
     * or "none" to disable
     * @param lib Optional, force a specific library to be used. If not passed, will try winston then bunyan then console.
     */
    setup(lib?: string | any, options?: any): void {
        let found = false
        let winston, bunyan

        // Set defaults.
        lib = lib || "console"
        options = options || {}

        // Passed "none"? This will effectively disable logging.
        if (lib == "none") {
            this._log = function() {
                return false
            }

            return
        }

        // Passed logger directly? Figure out which one it is based on object info.
        if (_.isObject(lib)) {
            if (lib.version && lib.transports && lib.verbose) {
                winston = lib
                lib = "winston"
            } else if (lib.constructor.name == "Logger" && lib.fields && lib._events) {
                lib = "bunyan"
            }
        }

        // First try Winston.
        if (lib == "winston") {
            try {
                if (!winston) {
                    winston = require("winston")
                }

                this._log = function(level, message) {
                    winston.log({level: level, message: message})
                }

                found = true
            } catch (ex) {
                console.error("Anyhow", "Could not load winston", ex)
            }
        }

        // Then Bunyan.
        if (lib == "bunyan") {
            try {
                if (!options.name) {
                    options.name = "Anyhow"
                }

                if (!bunyan) {
                    bunyan = require("bunyan").createLogger(options)
                }

                this._log = function(level, message) {
                    bunyan[level](message)
                }

                found = true
            } catch (ex) {
                console.error("Anyhow", "Could not load bunyan", ex)
            }
        }

        // No logging libraries found? Fall back to console.
        if (!found) {
            try {
                if (!chalk) {
                    chalk = require("chalk")
                }
            } catch (ex) {}

            this._log = (level, message) => this.console(level, message)
        }
    }

    /**
     * Default Anyhow constructor. Calls setup() by default.
     */
    constructor() {
        if (env != "test") {
            this.setup()
        }
    }

    /**
     * Gets a nice, readable message out of the passed array of arguments.
     * @param originalArgs Any single or collection of objects that will be transformed to a message string.
     */
    getMessage(originalArgs: any | any[]) {
        let value
        let separated = []
        let args = []

        if (arguments.length > 1) {
            for (value of Array.from(arguments)) {
                args.push(_.cloneDeep(value))
            }
        } else if (_.isArray(originalArgs)) {
            for (value of Array.from(originalArgs)) {
                args.push(_.cloneDeep(value))
            }
        } else if (_.isError(originalArgs)) {
            args.push(originalArgs)
        } else {
            args.push(_.cloneDeep(originalArgs))
        }

        if (this.preprocessor) {
            let processedArgs = this.preprocessor(args)
            args = processedArgs ? processedArgs : args
        }

        // Parse all arguments and stringify objects. Please note that fields defined
        // on the `removeFields` setting won't be added to the message.
        for (let arg of Array.from(args)) {
            try {
                if (arg != null) {
                    let stringified = ""

                    try {
                        if (_.isArray(arg)) {
                            for (value of Array.from(arg)) {
                                stringified += JSON.stringify(value, null, 2)
                            }
                        } else if (_.isError(arg)) {
                            const arrError = []
                            if (arg.friendlyMessage != null) {
                                arrError.push(arg.friendlyMessage)
                            }
                            if (arg.reason != null) {
                                arrError.push(arg.reason)
                            }
                            if (arg.code != null) {
                                arrError.push(arg.code)
                            }
                            arrError.push(arg.message)
                            arrError.push(arg.stack)
                            stringified = arrError.join(this.separator)
                        } else if (_.isObject(arg)) {
                            stringified = JSON.stringify(arg, null, 2)
                        } else {
                            stringified = arg.toString()
                        }
                    } catch (ex) {
                        stringified = arg.toString()
                    }

                    // Compact log lines?
                    if (this.compact) {
                        stringified = stringified.replace(/(\r\n|\n|\r)/gm, "").replace(/  +/g, " ")
                    }

                    separated.push(stringified)
                }
            } catch (ex) {
                // Critical error!
                console.error("Anyhow.getMessage", ex)
            }
        }

        // Return single string log message.
        return separated.join(this.separator)
    }
}

// Exports...
export = Anyhow.Instance
