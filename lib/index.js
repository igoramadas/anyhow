"use strict";
// Anyhow: index.ts
/** @hidden */
const _ = require("lodash");
/** @hidden */
let chalk = null;
/**
 * This is the main (and only) class of the Anyhow library.
 * @example const logger = require("anyhow")
 */
class Anyhow {
    constructor() {
        /**
         * Name of the current library being used, populated on setup().
         * Possible values are console, winston, bunyan and pino.
         */
        this._lib = null;
        /**
         * Messages will be compacted (spaces and breaks removed), default is true.
         * Set to false to log original values including spaces.
         */
        this.compact = true;
        /**
         * Log error stack traces? Default is false. Use it with care!
         * Set to true to add stack traces to the log output.
         */
        this.errorStack = false;
        /**
         * Include level (INFO, WARN, ERROR etc...) on the output message when
         * logging to the console? Default is true.
         */
        this.levelOnConsole = false;
        /**
         * Array that controls which log calls are enabled. By default
         * it's [[info]], [[warn]] and [[error]], so [[debug]] won't log anything.
         */
        this.levels = ["info", "warn", "error"];
        /**
         * Set the separator between arguments when generating logging messages.
         * Default separator is a pipe symbol " | ".
         */
        this.separator = " | ";
        /**
         * Default console logging styles to be used in case the `chalk` module is installed.
         * Please check the `chalk` documentation for the available styles.
         */
        this.styles = {
            /** Display debug logs in gray. */
            debug: ["gray"],
            /** Display info logs in white. */
            info: ["white"],
            /** Display warn logs in yellow. */
            warn: ["yellow"],
            /** Display error messages in bold red. */
            error: ["red", "bold"]
        };
        /**
         * Function to catch and log uncaught exceptions, set by [[logUncaughtExceptions]].
         */
        this._uncaughtExceptionHandler = null;
    }
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
    // PROPERTIES
    // --------------------------------------------------------------------------
    /**
     * Helper to check if [[setup]] was already called and logger is ready to log.
     */
    get isReady() {
        if (this._log) {
            return true;
        }
        return false;
    }
    /**
     * Getter for _lib, to be used by external modules.
     */
    get lib() {
        return this._lib;
    }
    /** Returns true if the uncaught exception handler is set, false otherwise. */
    get uncaughtExceptions() {
        return this._uncaughtExceptionHandler != null;
    }
    /** Enable or disable the uncaught exception handler to log unhandled exceptions. */
    set uncaughtExceptions(value) {
        if (value) {
            this._uncaughtExceptionHandler = err => {
                this.error("Uncaught exception", err);
                return;
            };
            process.on("uncaughtException", this._uncaughtExceptionHandler);
        }
        else {
            if (this._uncaughtExceptionHandler) {
                process.off("uncaughtException", this._uncaughtExceptionHandler);
            }
            this._uncaughtExceptionHandler = null;
        }
    }
    // LOGGING METHODS
    // --------------------------------------------------------------------------
    /**
     * Default logging method.
     * @param level String representing the level: error, warn, info, verbose, debug, silly
     * @param args Array of arguments to be logged.
     * @returns The generated message that was just logged.
     */
    log(level, args) {
        if (this.levels.indexOf(level.toLowerCase()) < 0)
            return null;
        let message = _.isString(args) ? args : this.getMessage(args);
        // If setup was not called yet, defaults to console logging and emit warning.
        if (!this.isReady) {
            console.warn("Anyhow: please call Anyhow's setup() on your application init. Will default to console.log() for now.");
            this.console(level, message);
        }
        else {
            this._log(level, message);
        }
        return message;
    }
    /**
     * Shortcut to [[log]]("debug", args).
     */
    debug(...args) {
        if (args.length < 1)
            return;
        let params = Array.from(arguments);
        let message = this.getMessage(params);
        return this.log("debug", message);
    }
    /**
     * Shortcut to [[log]]("info", args).
     */
    info(...args) {
        if (args.length < 1)
            return;
        let params = Array.from(arguments);
        let message = this.getMessage(params);
        return this.log("info", message);
    }
    /**
     * Shortcut to [[log]]("warn", args).
     */
    warn(...args) {
        if (args.length < 1)
            return;
        let params = Array.from(arguments);
        let message = this.getMessage(params);
        return this.log("warn", message);
    }
    /**
     * Shortcut to [[log]]("error", args).
     */
    error(...args) {
        if (args.length < 1)
            return;
        let params = Array.from(arguments);
        let message = this.getMessage(params);
        return this.log("error", message);
    }
    /**
     * Log directly to the console. This is the default logger handler
     * in case no other compatible libraries are found.
     * @param level String representing the level: error, warn, info, debug
     * @param args Array of arguments to be logged.
     * @returns The generated message that was just logged.
     */
    console(level, args) {
        if (this.levels.indexOf(level.toLowerCase()) < 0)
            return null;
        let message = _.isString(args) ? args : this.getMessage(args);
        // Add level to the output?
        if (this.levelOnConsole) {
            message = `${level.toUpperCase()}: ${message}`;
        }
        let styledMessage = message;
        let logMethod = console.log;
        // Check if console supports the passed level. Defaults to "log".
        if (console[level] && level != "debug") {
            logMethod = console[level];
        }
        // Is chalk installed? Use it to colorize the messages.
        if (chalk && this.styles) {
            let styles = this.styles[level];
            let chalkStyle;
            if (styles) {
                chalkStyle = chalk;
                for (let s of styles) {
                    chalkStyle = chalkStyle[s];
                }
            }
            else {
                chalkStyle = chalk.white;
            }
            styledMessage = chalkStyle(message);
        }
        logMethod(styledMessage);
        return message;
    }
    /**
     * Setup will try to load compatible loggers, and fall back
     * to the console if nothing was found. You can also force
     * a specific library to be loaded passing the object directly or
     * as string "winston|bunyan|console". Set "none" to disable logging.
     * @param lib Optional, force a specific library to be used. If not passed, will try winston then bunyan then console.
     * @param options Additional options to be passed to the underlying logging library.
     */
    setup(lib, options) {
        let found = false;
        let winston, bunyan, pino;
        // Set defaults.
        lib = lib || "console";
        options = options || {};
        // Passed "none"? This will effectively disable logging.
        if (lib == "none") {
            this._lib = null;
            this._log = function () {
                return false;
            };
            return;
        }
        // Passed logger directly? Figure out which one it is based on object info.
        if (_.isObject(lib)) {
            if (lib.constructor.name == "DerivedLogger" && lib.format && lib.level) {
                winston = lib;
                lib = "winston";
            }
            else if (lib.constructor.name == "Logger" && lib.fields) {
                bunyan = lib;
                lib = "bunyan";
            }
            else if (lib.constructor.name == "Pino" && lib.levels) {
                bunyan = lib;
                lib = "pino";
            }
            else {
                console.warn("Anyhow.setup", "Passed object was not recognized as Winston / Bunyan / Pino.");
            }
        }
        // First try Winston. It will check if a Winston logger was passed directly
        // as `lib`, or use default logger if passed as string.
        if (lib == "winston") {
            try {
                if (!winston) {
                    winston = require("winston");
                }
                this._lib = "winston";
                this._log = function (level, message) {
                    winston.log({ level: level, message: message });
                };
                found = true;
            }
            catch (ex) {
                /* istanbul ignore next */
                console.error("Anyhow.setup", "Could not load winston", ex);
            }
        }
        // Then Bunyan. It will check if a Bunyan logger was passed directly
        // as `lib`, or create a default logger if passed as string.
        if (lib == "bunyan") {
            try {
                if (!options.name) {
                    options.name = "Anyhow";
                }
                if (!bunyan) {
                    bunyan = require("bunyan").createLogger(options);
                }
                this._lib = "bunyan";
                this._log = function (level, message) {
                    bunyan[level](message);
                };
                found = true;
            }
            catch (ex) {
                /* istanbul ignore next */
                console.error("Anyhow.setup", "Could not load bunyan", ex);
            }
        }
        // Then Pino. It will check if a Pino logger was passed directly
        // as `lib`, or create a default logger if passed as string.
        if (lib == "pino") {
            try {
                if (!options.name) {
                    options.name = "Anyhow";
                }
                if (!pino) {
                    pino = require("pino")();
                }
                this._lib = "pino";
                this._log = function (level, message) {
                    pino[level](message);
                };
                found = true;
            }
            catch (ex) {
                /* istanbul ignore next */
                console.error("Anyhow.setup", "Could not load pino", ex);
            }
        }
        // No logging libraries found? Fall back to console.
        if (!found) {
            try {
                if (!chalk) {
                    chalk = require("chalk");
                }
            }
            catch (ex) { }
            this._lib = "console";
            this._log = (level, message) => this.console(level, message);
        }
    }
    /**
     * Gets a nice, readable message out of the passed arguments, which can be of any type.
     * @param args Any single or collection of objects that will be transformed to a message string.
     * @returns Human readable string taken out of the parsed arguments.
     */
    getMessage(args) {
        if (arguments.length > 1) {
            args = Array.from(arguments);
        }
        else if (!_.isArray(args)) {
            args = [args];
        }
        if (this.preprocessor) {
            let processedArgs = this.preprocessor(args);
            args = processedArgs ? processedArgs : args;
        }
        // Return single string log message.
        return this.parseArgsForMessage(args).join(this.separator);
    }
    /**
     * Used by [[getMessage]] to parse and return the individual log strings
     * out of the passed arguments. Might run recursively.
     * @param args Array of arguments to be parsed.
     */
    parseArgsForMessage(args) {
        let result = [];
        // Parse all arguments and stringify objects. Please note that fields defined
        // on the `removeFields` setting won't be added to the message.
        for (let arg of args) {
            try {
                if (arg != null) {
                    let stringified = "";
                    try {
                        if (_.isArray(arg)) {
                            result = result.concat(this.parseArgsForMessage(arg));
                        }
                        else if (_.isError(arg)) {
                            const arrError = [];
                            // Add error information separately.
                            if (arg.friendlyMessage) {
                                arrError.push(arg.friendlyMessage);
                            }
                            if (arg.reason) {
                                arrError.push(arg.reason);
                            }
                            if (arg.code) {
                                arrError.push(arg.code);
                            }
                            /* istanbul ignore else */
                            if (arg.message) {
                                arrError.push(arg.message);
                            }
                            // Only add stack traces if `errorStack` is set.
                            if (arg.stack && this.errorStack) {
                                arrError.push(arg.stack);
                            }
                            stringified = arrError.join(this.separator);
                        }
                        else if (_.isObject(arg)) {
                            stringified = JSON.stringify(arg, null, 2);
                        }
                        else {
                            stringified = arg.toString();
                        }
                    }
                    catch (ex) {
                        /* istanbul ignore next */
                        stringified = arg.toString();
                    }
                    // Check if a valid message was taken, and if it needs to be compacted.
                    /* istanbul ignore else */
                    if (typeof stringified != "undefined" && stringified !== null) {
                        if (this.compact) {
                            stringified = stringified.replace(/(\r\n|\n|\r)/gm, "").replace(/  +/g, " ");
                        }
                        result.push(stringified);
                    }
                }
            }
            catch (ex) {
                /* istanbul ignore next */
                console.error("Anyhow.parseArgsForMessage", ex);
            }
        }
        return result;
    }
}
module.exports = Anyhow.Instance;
