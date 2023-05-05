// Anyhow: Types

// Default options.
export const defaultOptions: AnyhowOptions = {
    compact: true,
    maxDepth: 10,
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
        maskedFields: [
            "authorization",
            "password",
            "passcode",
            "secret",
            "token",
            "accesstoken",
            "access_token",
            "refreshtoken",
            "refresh_token",
            "clientsecret",
            "client_secret",
            "apikey",
            "api_key",
            "apisecret",
            "api_secret",
            "privatekey",
            "private_key"
        ],
        clone: true
    }
}

/**
 * Anyhow library and parsing options.
 */
export interface AnyhowOptions {
    /** Application or service name. */
    appName?: string
    /** Compact output messages? */
    compact?: boolean
    /** Logging levels. */
    levels?: LoggingLevel[]
    /** Output the log level to the console? */
    levelOnConsole?: boolean
    /** Max depth to follow when processing object properties and arrays. */
    maxDepth?: number
    /** Prepend log messages with a timestamp? */
    timestamp?: boolean
    /** Message argument separator. */
    separator?: string
    /** Arguments preprocessors. */
    preprocessors?: PreProcessor[]
    /** Additional options to be passed to the preprocessors. */
    preprocessorOptions?: PreProcessorOptions
    /** Log uncaught exceptions? */
    uncaughtExceptions?: boolean
    /** Log unhandled rejections? */
    unhandledRejections?: boolean
    /** Styles to be applied to the console (using the Chalk helper, if available). */
    styles?: {
        [level in LoggingLevel]: string[]
    }
}

/**
 * Additional options to be passed to the preprocessors.
 */
export interface PreProcessorOptions {
    /** Clone passed objects before processing them? */
    clone?: boolean
    /** Log exception stack? */
    errorStack?: boolean
    /** List of field names that should be masked. */
    maskedFields?: string[]
}

/**
 * Defines a logger (with library name and log function).
 */
export interface Logger {
    /** Logger name. */
    name: string
    /** Instance reference. */
    instance?: any
    /** Main log method. */
    log?(level: string, message: string)
}

/**
 * Logging levels: debug, info, warn, error.
 */
export type LoggingLevel = "debug" | "info" | "warn" | "error" | string

/**
 * Arguments preprocessors.
 */
export type PreProcessor = "cleanup" | "friendlyErrors" | "maskSecrets" | Function
