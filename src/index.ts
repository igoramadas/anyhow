// Anyhow: index.ts

import {AnyhowOptions, Logger} from "./types"
import {libSetup} from "./setup"
import {cloneDeep, dedupArray, getTimestamp, mergeDeep} from "./utils"
import parser from "./parser"

// Chalk (colorized console output). Will be instantiated on setup().
let chalk = null

// Default options.
const defaultOptions: AnyhowOptions = {
    compact: true,
    maxDepth: 5,
    appName: "Anyhow",
    separator: " | ",
    levels: ["info", "warn", "error"],
    styles: {
        debug: ["gray"],
        info: ["white"],
        warn: ["yellow"],
        error: ["red", "bold"]
    },
    preprocessors: [],
    preprocessorOptions: {
        maskedFields: ["password", "passcode", "secret", "token", "accessToken", "access_token", "refreshToken", "refresh_token", "clientSecret", "client_secret", "Authorization"],
        clone: true
    }
}

/**
 * This is the main class of the Anyhow library.
 * @example const logger = require("anyhow")
 */
class Anyhow {
    private static _instance: Anyhow
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Init with default options.
     */
    constructor() {
        this.options = cloneDeep(defaultOptions)
    }

    // PROPERTIES
    // --------------------------------------------------------------------------

    /**
     * Internal object defining a Logger.
     */
    private _logger: Logger = null

    /**
     * Getter for _lib, to be used by external modules.
     */
    get logger(): Logger {
        return this._logger
    }

    /**
     * For compatibility only, now returns the logger's name.
     */
    get lib(): string {
        return this._logger ? this._logger.name : "none"
    }

    /**
     * Helper to check if [[setup]] was already called and logger is ready to log.
     */
    get isReady(): boolean {
        if (this._logger) {
            return true
        }

        return false
    }

    /**
     * Library options (internal).
     */
    private _options: AnyhowOptions

    /**
     * Get library options.
     */
    get options(): AnyhowOptions {
        return this._options
    }

    /**
     * Set library options.
     */
    set options(value: AnyhowOptions) {
        const newOptions = value ? mergeDeep(defaultOptions, value) : cloneDeep(defaultOptions)
        this.applyOptions(newOptions)
    }

    /**
     * Function to catch and log uncaught exceptions, set by [[uncaughtExceptions]].
     */
    private _uncaughtExceptionHandler: Function = null

    /**
     * Enable or disable the uncaught exception handler.
     */
    private set uncaughtExceptions(value: boolean) {
        if (value) {
            this._uncaughtExceptionHandler = (err) => {
                this.error(this._options.appName, "Uncaught exception", err)

                return
            }
            process.on("uncaughtException" as any, this._uncaughtExceptionHandler as any)
        } else {
            if (this._uncaughtExceptionHandler) {
                process.off("uncaughtException", this._uncaughtExceptionHandler as any)
            }
            this._uncaughtExceptionHandler = null
        }
    }

    /**
     * Function to catch and log unhandled rejections, set by [[unhandledRejections]].
     */
    private _unhandledRejectionHandler: Function = null

    /**
     * Enable or disable the unhandled rejection handler.
     */
    private set unhandledRejections(value: boolean) {
        if (value) {
            this._unhandledRejectionHandler = (err) => {
                this.error(this._options.appName, "Unhandled rejection", err)

                return
            }
            process.on("unhandledRejection" as any, this._unhandledRejectionHandler as any)
        } else {
            if (this._unhandledRejectionHandler) {
                process.off("Unhandled rejection", this._unhandledRejectionHandler as any)
            }
            this._unhandledRejectionHandler = null
        }
    }

    /**
     * Auto-generated list of messages that should not be logged.
     */
    private ignoreMessages: {[message: string]: number} = {}

    // LOGGING METHODS
    // --------------------------------------------------------------------------

    /**
     * Default logging method.
     * @param level String representing the level: error, warn, info, verbose, debug, silly
     * @param args Array of arguments to be logged.
     * @returns The generated message that was just logged.
     */
    log(level: string, args: any | any[]): string {
        if (this._options.levels.indexOf(level) < 0) return null

        let message = parser.getMessage(args)

        // Add timestamp?
        if (this.options.timestamp) {
            message = `${getTimestamp()}${this.options.separator}${message}`
        }

        // If setup was not called yet, defaults to console logging and emit warning.
        if (!this.isReady) {
            console.warn("Anyhow: please call Anyhow's setup() on your application startup. Will default to console.log() for now.")
            this.setup("console")
            this.console(level, message)
        } else {
            this._logger.log(level, message)
        }

        return message
    }

    /**
     * Shortcut to [[log]]("debug", args).
     */
    debug = (...args: any[]): string => {
        if (this._options.levels.indexOf("debug") < 0) return null
        if (args.length < 1) return
        let message = parser.getMessage(args, ["friendlyErrors"])
        return this.log("debug", message)
    }

    /**
     * Shortcut to [[log]]("info", args).
     */
    info = (...args: any[]): string => {
        if (this._options.levels.indexOf("info") < 0) return null
        if (args.length < 1) return
        let message = parser.getMessage(args, ["friendlyErrors"])
        return this.log("info", message)
    }

    /**
     * Shortcut to [[log]]("warn", args).
     */
    warn = (...args: any[]): string => {
        if (this._options.levels.indexOf("warn") < 0) return null
        if (args.length < 1) return
        let message = parser.getMessage(args)
        return this.log("warn", message)
    }

    /**
     * Shortcut to [[log]]("error", args).
     */
    error = (...args: any[]): string => {
        if (this._options.levels.indexOf("error") < 0) return null
        if (args.length < 1) return
        let message = parser.getMessage(args)
        return this.log("error", message)
    }

    /**
     * Shortcut to [[log]]("warn", args), with a deprecation notice.
     * Will not log if the noDeprecation flag is set.
     */
    deprecated = (...args: any[]): string => {
        if (args.length < 1 || process["noDeprecation"]) return
        let message = parser.getMessage(args)
        if (this.ignoreMessages[message]) {
            this.ignoreMessages[message]++
            return ""
        }
        this.ignoreMessages[message] = 1
        return this.log("warn", `DEPRECATED! ${message}`)
    }

    /**
     * Shortcut to [[log]]("debug", args) with object inspection instead of plain text.
     */
    inspect = (...args: any[]): string => {
        if (args.length < 1) return
        let message = parser.getInspection(args)
        return this.log("debug", message)
    }

    /**
     * Log directly to the console. This is the default logger handler
     * in case no other compatible libraries are found.
     * @param level String representing the level: error, warn, info, debug
     * @param args Array of arguments to be logged.
     * @returns The generated message that was just logged.
     */
    console = (level: string, args: any): string => {
        if (this._options.levels.indexOf(level.toLowerCase()) < 0) return null

        let message = parser.getMessage(args)

        // Add level to the output?
        if (this._options.levelOnConsole) {
            message = `${level.toUpperCase()}: ${message}`
        }

        let styledMessage = message
        let logMethod = console.log

        // Check if console supports the passed level. Defaults to "log".
        if (console[level] && level != "debug") {
            logMethod = console[level]
        }

        // Is chalk enabled? Use it to colorize the messages.
        if (chalk && this._options.styles) {
            let styles = this._options.styles[level]
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

    // SETUP AND CONFIGURING
    // --------------------------------------------------------------------------

    /**
     * Setup will try to load compatible loggers, and fall back to the console
     * if nothing was found. Will try using libraries on this order:
     * winston, bunyan, pino, gcloud, console.
     * @param lib Optional, force a specific library or Logger to be used, defaults to console.
     * @param libOptions Additional options to be passed to the underlying logging library.
     */
    setup = (lib?: "winston" | "bunyan" | "pino" | "gcloud" | "console" | "none" | Logger, libOptions?: any): void => {
        if (!lib) lib = "console"

        libSetup(this, lib, libOptions)

        if (lib == "console" && this._options.styles) {
            try {
                if (chalk === null) {
                    chalk = require("chalk")
                }
            } catch (ex) {
                /* istanbul ignore next */
                chalk = false
            }
        }
    }

    /**
     * Helper to set partial library options. Only the passed parameters will be updated.
     * @param options Options to be updated.
     */
    setOptions = (options: AnyhowOptions): void => {
        if (!options) return

        const newOptions = mergeDeep(this._options, options)
        this.applyOptions(newOptions)
    }

    /**
     * Apply a new options object to the library.
     * @param newOptions New options object to be applied.
     */
    private applyOptions = (newOptions: AnyhowOptions): void => {
        if (newOptions.levels && newOptions.levels.length > 0) {
            newOptions.levels = dedupArray(newOptions.levels)
        } else {
            newOptions.levels = []
        }

        if (newOptions.preprocessors && newOptions.preprocessors.length > 0) {
            newOptions.preprocessors = dedupArray(newOptions.preprocessors)
        } else {
            newOptions.preprocessors = []
        }

        if (newOptions.preprocessorOptions && newOptions.preprocessorOptions.maskedFields && newOptions.preprocessorOptions.maskedFields.length > 0) {
            newOptions.preprocessorOptions.maskedFields = dedupArray(newOptions.preprocessorOptions.maskedFields)
        }

        if (newOptions.styles) {
            for (let key in newOptions.styles) {
                if (newOptions.styles[key].length > 0) {
                    newOptions.styles[key] = dedupArray(newOptions.styles[key])
                }
            }
        } else {
            newOptions.styles = {}
        }

        this.uncaughtExceptions = newOptions.uncaughtExceptions
        this.unhandledRejections = newOptions.unhandledRejections

        this._options = newOptions
        parser.options = newOptions
    }
}

// Exports...
export = Anyhow.Instance
