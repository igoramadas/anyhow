/**
 * This is the main (and only) class of the Anyhow library.
 * @example const logger = require("anyhow")
 */
declare class Anyhow {
    private static _instance;
    /** @hidden */
    static readonly Instance: Anyhow;
    /**
     * Helper to check if [[setup]] was already called and logger is ready to log.
     */
    readonly isReady: boolean;
    /**
     * Private logging function. This will be set on [[setup]].
     */
    private _log;
    /**
     * Name of the current library being used, populated on setup().
     * Possible values are console, winston, bunyan and pino.
     */
    private _lib;
    /**
     * Getter for _lib, to be used by external modules.
     */
    readonly lib: string;
    /**
     * Messages will be compacted (spaces and breaks removed), default is true.
     * Set to false to log original values including spaces.
     */
    compact: boolean;
    /**
     * Log error stack traces? Default is false. Use it with care!
     * Set to true to add stack traces to the log output.
     */
    errorStack: boolean;
    /**
     * Include level (INFO, WARN, ERROR etc...) on the output message when
     * logging to the console? Default is true.
     */
    levelOnConsole: boolean;
    /**
     * Array that controls which log calls are enabled. By default
     * it's [[info]], [[warn]] and [[error]], so [[debug]] won't log anything.
     */
    levels: string[];
    /**
     * Set the separator between arguments when generating logging messages.
     * Default separator is a pipe symbol " | ".
     */
    separator: string;
    /**
     * Default console logging styles to be used in case the `chalk` module is installed.
     * Please check the `chalk` documentation for the available styles.
     */
    styles: any;
    /**
     * A function(arrayOfObjects) that should be called to preprocess the arguments.
     * This is useful if you wish to remove or obfuscate data before generating the
     * logging message. Can either mutate the passed arguments or return the
     * processed array as a result.
     */
    preprocessor: Function;
    /**
     * Function to catch and log uncaught exceptions, set by [[logUncaughtExceptions]].
     */
    private _uncaughtExceptionHandler;
    /** Returns true if the uncaught exception handler is set, false otherwise. */
    /** Enable or disable the uncaught exception handler to log unhandled exceptions. */
    logUncaughtExceptions: boolean;
    /**
     * Default logging method.
     * @param level String representing the level: error, warn, info, verbose, debug, silly
     * @param args Array of arguments to be logged.
     * @returns The generated message that was just logged.
     */
    log(level: string, args: any | any[]): string;
    /**
     * Shortcut to [[log]]("debug", args).
     */
    debug(...args: any[]): string;
    /**
     * Shortcut to [[log]]("info", args).
     */
    info(...args: any[]): string;
    /**
     * Shortcut to [[log]]("warn", args).
     */
    warn(...args: any[]): string;
    /**
     * Shortcut to [[log]]("error", args).
     */
    error(...args: any[]): string;
    /**
     * Log directly to the console. This is the default logger handler
     * in case no other compatible libraries are found.
     * @param level String representing the level: error, warn, info, debug
     * @param args Array of arguments to be logged.
     * @returns The generated message that was just logged.
     */
    console(level: string, args: any): string;
    /**
     * Setup will try to load compatible loggers, and fall back
     * to the console if nothing was found. You can also force
     * a specific library to be loaded passing the object directly or
     * as string "winston|bunyan|console". Set "none" to disable logging.
     * @param lib Optional, force a specific library to be used. If not passed, will try winston then bunyan then console.
     * @param options Additional options to be passed to the underlying logging library.
     */
    setup(lib?: string | any, options?: any): void;
    /**
     * Gets a nice, readable message out of the passed arguments, which can be of any type.
     * @param args Any single or collection of objects that will be transformed to a message string.
     * @returns Human readable string taken out of the parsed arguments.
     */
    getMessage(args: any | any[]): string;
    /**
     * Used by [[getMessage]] to parse and return the individual log strings
     * out of the passed arguments. Might run recursively.
     * @param args Array of arguments to be parsed.
     */
    private parseArgsForMessage;
}
declare const _default: Anyhow;
export = _default;
