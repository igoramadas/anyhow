// Anyhow: index.ts

/** @hidden */
const _ = require("lodash")
/** @hidden */
let chalk = null

/** This is the main (and only) class of the library. */
class Anyhow {
    private static _instance: Anyhow
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    // PROPERTIES
    // --------------------------------------------------------------------------

    /**
     * Helper to check if [[setup]] was already called and logger is ready to log.
     */
    get isReady() {
        if (this._log) {
            return true
        }

        return false
    }

    /**
     * Private logging function. This will be set on [[setup]].
     */
    private _log: Function

    /**
     * Default is true. Messages will be compacted (spaces and breaks removed).
     * Set to false to log original values including spaces.
     */
    compact: boolean = true

    /**
     * Set the separator between arguments when generating logging messages.
     * Default separator is a pipe symbol " | ".
     */
    separator: string = " | "

    /**
     * Default console logging styles to be used in case the `chalk` module is installed.
     * Please check the `chalk` documentation for the available styles.
     */
    styles: object = {
        /** Display debug logs in gray. */
        debug: ["gray"],
        /** Display info logs in white. */
        info: ["white"],
        /** Display warn logs in yellow. */
        warn: ["yellow"],
        /** Display error messages in bold red. */
        error: ["red", "bold"]
    }

    /**
     * A function that should be called to preprocess the arguments.
     * This is useful if you wish to remove or obfuscate data before
     * generating the logging message. Can either mutate the passed
     * arguments or return them processed as a result.
     */
    preprocessor: Function

    /**
     * Default logging method.
     * @param level String representing the level: error, warn, info, verbose, debug, silly
     * @param args Array of arguments to be logged.
     * @returns The generated message that was just logged.
     */
    log(level: string, args: any | any[]): string {
        let message = _.isString(args) ? args : this.getMessage(args)
        this._log(level, message)
        return message
    }

    /**
     * Shortcut to [[log]]("debug", args).
     */
    debug(...args: any[]): string {
        if (args.length < 1) return
        let params = Array.from(arguments)
        let message = this.getMessage(params)
        return this.log("debug", message)
    }

    /**
     * Shortcut to [[log]]("info", args).
     */
    info(...args: any[]): string {
        if (args.length < 1) return
        let params = Array.from(arguments)
        let message = this.getMessage(params)
        return this.log("info", message)
    }

    /**
     * Shortcut to [[log]]("warn", args).
     */
    warn(...args: any[]): string {
        if (args.length < 1) return
        let params = Array.from(arguments)
        let message = this.getMessage(params)
        return this.log("warn", message)
    }

    /**
     * Shortcut to [[log]]("error", args).
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
     * a specific library to be loaded passing the object directly or
     * as string "winston|bunyan|console". Set "none" to disable logging.
     * @param lib Optional, force a specific library to be used. If not passed, will try winston then bunyan then console.
     * @param options Additional options to be passed to the underlying logging library.
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
            if (lib.constructor.name == "DerivedLogger" && lib.format && lib.level) {
                winston = lib
                lib = "winston"
            } else if (lib.constructor.name == "Logger" && lib.fields && lib._events) {
                bunyan = lib
                lib = "bunyan"
            }
        }

        // First try Winston. It will check if a Winston logger was passed directly
        // as `lib`, or use default logger if passed as string.
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
                /* istanbul ignore next */
                console.error("Anyhow", "Could not load winston", ex)
            }
        }

        // Then Bunyan. It will check if a Bunyan logger was passed directly
        // as `lib`, or create a default logger if passed as string.
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
                /* istanbul ignore next */
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
     * Gets a nice, readable message out of the passed  arguments.
     * This is mainly used internally but exposed in case external
     * modules want to make use of this feature as well.
     * @param args Any single or collection of objects that will be transformed to a message string.
     * @returns Human readable string taken out of the parsed arguments.
     */
    getMessage(args: any | any[]): string {
        if (arguments.length > 1) {
            args = Array.from(arguments)
        } else if (!_.isArray(args)) {
            args = [args]
        }

        if (this.preprocessor) {
            let processedArgs = this.preprocessor(args)
            args = processedArgs ? processedArgs : args
        }

        // Return single string log message.
        return this.parseArgsForMessage(args).join(this.separator)
    }

    /**
     * Used by [[getMessage]] to parse and return the individual log strings
     * out of the passed arguments. Might run recursively.
     * @param args Array of arguments to be parsed.
     */
    private parseArgsForMessage(args: any[]): string[] {
        let result = []

        // Parse all arguments and stringify objects. Please note that fields defined
        // on the `removeFields` setting won't be added to the message.
        for (let arg of args) {
            try {
                if (arg != null) {
                    let stringified = ""

                    try {
                        if (_.isArray(arg)) {
                            result = result.concat(this.parseArgsForMessage(arg))
                        } else if (_.isError(arg)) {
                            const arrError = []

                            // Add error information separately.
                            if (arg.friendlyMessage) {
                                arrError.push(arg.friendlyMessage)
                            }
                            if (arg.reason) {
                                arrError.push(arg.reason)
                            }
                            if (arg.code) {
                                arrError.push(arg.code)
                            }
                            if (arg.message) {
                                arrError.push(arg.message)
                            }

                            // If you wish to avoid logging error stack traces you can
                            // set a _logNoStack property on it.
                            if (arg.stack && !arg._logNoStack) {
                                arrError.push(arg.stack)
                            }

                            stringified = arrError.join(this.separator)
                        } else if (_.isObject(arg)) {
                            stringified = JSON.stringify(arg, null, 2)
                        } else {
                            stringified = arg.toString()
                        }
                    } catch (ex) {
                        /* istanbul ignore next */
                        stringified = arg.toString()
                    }

                    // Check if a valid message was taken, and if it needs to be compacted.
                    if (typeof stringified != "undefined" && stringified !== null) {
                        if (this.compact) {
                            stringified = stringified.replace(/(\r\n|\n|\r)/gm, "").replace(/  +/g, " ")
                        }

                        result.push(stringified)
                    }
                }
            } catch (ex) {
                /* istanbul ignore next */
                console.error("Anyhow.parseArgsForMessage", ex)
            }
        }

        return result
    }
}

// Exports...
export = Anyhow.Instance
