/**
 * Anyhow
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
     * Default is true. Messages will be compacted (spaces and breaks removed).
     * Set to false to log original values including spaces.
     */
    compact: boolean;
    /**
     * Set the separator between arguments when generating logging messages.
     * Default separator is a vertical line " | ".
     */
    separator: string;
    /**
     * Default console logging styles to be used in case the `chalk` module is installed.
     * Please check the `chalk` documentation for the available styles.
     */
    styles: any;
    /**
     * A function that should be called to preprocess the arguments.
     * This is useful if you wish to remove or obfuscate data before
     * generating the logging message. Can either mutate the passed
     * arguments or return them processed as a result.
     *
     */
    preprocessor: Function;
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
     */
    setup(lib?: string | any, options?: any): void;
    /**
     * Gets a nice, readable message out of the passed array of arguments.
     * @param originalArgs Any single or collection of objects that will be transformed to a message string.
     */
    getMessage(originalArgs: any | any[]): string;
}
declare const _default: Anyhow;
export = _default;
