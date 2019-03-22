/**
 * Anyhow
 */

const _ = require("lodash")
let chalk = null

class Anyhow {
    private static _instance: Anyhow
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Default is true. Messages will be compacted (spaces and breaks removed).
     * Set to false to log original values including spaces.
     */
    compact: boolean = true

    /**
     * A function that should be called to preprocess the arguments.
     * This is useful if you wish to remove or obfuscate data before
     * generating the logging message.
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
    debug(): string {
        let params = Array.from(arguments)
        let message = this.getMessage(params)
        return this.log("debug", message)
    }

    /**
     * Shortcut to log("info", args).
     */
    info(): string {
        let params = Array.from(arguments)
        let message = this.getMessage(params)
        return this.log("info", message)
    }

    /**
     * Shortcut to log("warn", args).
     */
    warn(): string {
        let params = Array.from(arguments)
        let message = this.getMessage(params)
        return this.log("warn", message)
    }

    /**
     * Shortcut to log("error", args).
     */
    error(): string {
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
     * to the console if nothing was found.
     */
    setup(): void {
        let found = false

        // First try Winston.
        try {
            const winston = require("winston")
            winston.add(new winston.transports.Console())

            this._log = function(level, message) {
                winston.log({level: level, message: message})
            }

            found = true
        } catch (ex) {}

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
     * Default Anyhow constructor.
     */
    constructor() {
        this.setup()
    }

    /**
     * Finds the correct path to the file looking first on the (optional) base path
     * then the current or running directory, finally the root directory.
     * Returns null if file is not found.
     * @param filename The filename to be searched
     * @param basepath Optional, basepath where to look for the file.
     * @returns The full path to the file if one was found, or null if not found.
     */
    getMessage(originalArgs) {
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
        } else {
            args.push(_.cloneDeep(originalArgs))
        }

        if (this.preprocessor) {
            args = this.preprocessor(args)
        }

        // Parse all arguments and stringify objects. Please note that fields defined
        // on the `removeFields` setting won't be added to the message.
        for (let arg of Array.from(args)) {
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
        }

        // Return single string log message.
        return separated.join(this.separator)
    }
}

// Exports singleton.
export = Anyhow.Instance
