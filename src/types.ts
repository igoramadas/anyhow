// Anyhow: Types

/**
 * Defines a logger (with library name and log function).
 */
export interface Logger {
    name: string
    instance?: any
    log?(level: string, message: string)
}
