// Anyhow: index.ts

import {Logger} from "./types"
import parser from "./parser"
import _ from "lodash"
import {libSetup} from "./setup"

// Chalk (colorized console output).
let chalk = null

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
     * Name of the current running app. This will be used when logging
     * uncaught exceptions, rejections and in similar cases.
     */
    appName: string

    /**
     * Include level (INFO, WARN, ERROR etc...) on the output message when
     * logging to the console? Default is true.
     */
    levelOnConsole: boolean = false

    /**
     * Array that controls which log calls are enabled. By default
     * it's [[info]], [[warn]] and [[error]], so [[debug]] won't log anything.
     */
    levels: string[] = ["info", "warn", "error"]

    /**
     * Default console logging styles to be used in case the `chalk` module is installed.
     * Please check the `chalk` documentation for the available styles.
     */
    styles: any = {
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
     * Function to catch and log uncaught exceptions, set by [[uncaughtExceptions]].
     */
    private _uncaughtExceptionHandler: Function = null

    /**
     * Function to catch and log unhandled rejections, set by [[unhandledRejections]].
     */
    private _unhandledRejectionHandler: Function = null

    /** Returns true if the uncaught exception handler is set, false otherwise. */
    get uncaughtExceptions(): boolean {
        return this._uncaughtExceptionHandler != null
    }

    /** Enable or disable the uncaught exception handler. */
    set uncaughtExceptions(value: boolean) {
        if (value) {
            this._uncaughtExceptionHandler = (err) => {
                this.error(this.appName || "Anyhow", "Uncaught exception", err)

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

    /** Returns true if the unhandled rejection handler is set, false otherwise. */
    get unhandledRejections(): boolean {
        return this._unhandledRejectionHandler != null
    }

    /** Enable or disable the unhandled rejection handler. */
    set unhandledRejections(value: boolean) {
        if (value) {
            this._unhandledRejectionHandler = (err) => {
                this.error(this.appName || "Anyhow", "Unhandled rejection", err)

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

    // PARSER PROPERTIES
    // --------------------------------------------------------------------------

    /**
     * Messages will be compacted (spaces and breaks removed), default is true.
     * Set to false to log original values including spaces.
     */
    get compact(): boolean {
        return parser.compact
    }
    set compact(value: boolean) {
        parser.compact = value
    }

    /**
     * Prepend logged messages with a timestamp on the format YY-MM-DD hh:mm:ss.
     * default is false.
     */
    get timestamp(): boolean {
        return parser.timestamp
    }
    set timestamp(value: boolean) {
        parser.timestamp = value
    }

    /**
     * Log error stack traces? Default is false. Use it with care!
     * Set to true to add stack traces to the log output.
     */
    get errorStack(): boolean {
        return parser.errorStack
    }
    set errorStack(value: boolean) {
        parser.errorStack = value
    }

    /**
     * Set the separator between arguments when generating logging messages.
     * Default separator is a pipe symbol " | ".
     */
    get separator(): string {
        return parser.separator
    }
    set separator(value: string) {
        parser.separator = value
    }

    /**
     * A function(arrayOfObjects) that should be called to preprocess the arguments.
     * This is useful if you wish to remove or obfuscate data before generating the
     * logging message. Can either mutate the passed arguments or return the
     * processed array as a result.
     */
    get preprocessor(): Function {
        return parser.preprocessor
    }
    set preprocessor(value: Function) {
        parser.preprocessor = value
    }

    // LOGGING METHODS
    // --------------------------------------------------------------------------

    /**
     * Default logging method.
     * @param level String representing the level: error, warn, info, verbose, debug, silly
     * @param args Array of arguments to be logged.
     * @returns The generated message that was just logged.
     */
    log(level: string, args: any | any[]): string {
        if (this.levels.indexOf(level.toLowerCase()) < 0) return null

        let message = _.isString(args) ? args : parser.getMessage(args)

        // If setup was not called yet, defaults to console logging and emit warning.
        if (!this.isReady) {
            console.warn("Anyhow: please call Anyhow's setup() on your application init. Will default to console.log() for now.")
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
        if (this.levels.indexOf("debug") < 0) return null
        if (args.length < 1) return
        let message = parser.getMessage(args)
        return this.log("debug", message)
    }

    /**
     * Shortcut to [[log]]("info", args).
     */
    info = (...args: any[]): string => {
        if (this.levels.indexOf("info") < 0) return null
        if (args.length < 1) return
        let message = parser.getMessage(args)
        return this.log("info", message)
    }

    /**
     * Shortcut to [[log]]("warn", args).
     */
    warn = (...args: any[]): string => {
        if (this.levels.indexOf("warn") < 0) return null
        if (args.length < 1) return
        let message = parser.getMessage(args)
        return this.log("warn", message)
    }

    /**
     * Shortcut to [[log]]("error", args).
     */
    error = (...args: any[]): string => {
        if (this.levels.indexOf("error") < 0) return null
        if (args.length < 1) return
        let message = parser.getMessage(args)
        return this.log("error", message)
    }

    /**
     * Log directly to the console. This is the default logger handler
     * in case no other compatible libraries are found.
     * @param level String representing the level: error, warn, info, debug
     * @param args Array of arguments to be logged.
     * @returns The generated message that was just logged.
     */
    console = (level: string, args: any): string => {
        if (this.levels.indexOf(level.toLowerCase()) < 0) return null

        let message = _.isString(args) ? args : parser.getMessage(args)

        // Add level to the output?
        if (this.levelOnConsole) {
            message = `${level.toUpperCase()}: ${message}`
        }

        let styledMessage = message
        let logMethod = console.log

        // Check if console supports the passed level. Defaults to "log".
        if (console[level] && level != "debug") {
            logMethod = console[level]
        }

        try {
            if (chalk === null) {
                chalk = require("chalk")
            }
        } catch (ex) {
            chalk = false
        }

        // Is chalk installed? Use it to colorize the messages.
        if (chalk && this.styles) {
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
     * Setup will try to load compatible loggers, and fall back to the console
     * if nothing was found. Will try using libraries on this order:
     * winston, bunyan, pino, gcloud, console.
     * @param lib Optional, force a specific library or Logger to be used.
     * @param options Additional options to be passed to the underlying logging library.
     */
    setup = (lib?: "winston" | "bunyan" | "pino" | "gcloud" | "console" | "none" | Logger, options?: any): void => {
        libSetup(this, lib, options)
    }
}

// Exports...
export = Anyhow.Instance
