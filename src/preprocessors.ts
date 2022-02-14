// Anyhow: preprocessors

import {AnyhowOptions, PreProcessor} from "./types"
import {cloneDeep, getTag, isArray, isDate, isError, isFunction, isObject, isString} from "./utils"

/**
 * Parser methods to build a message out of passed logging arguments.
 */
class AnyhowPreProcessors {
    private static _instance: AnyhowPreProcessors
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    // MAIN METHOD
    // --------------------------------------------------------------------------

    /**
     * Execute the passed preprocessors.
     * @param options Library options.
     * @param args Arguments to be processed.
     * @param preprocessors List of preprocessors to be executed.
     */
    run = (options: AnyhowOptions, args: any[], preprocessors: PreProcessor[]): any[] => {
        const hasFriendlyErrors = preprocessors.includes("friendlyErrors")
        const hasCleanup = preprocessors.includes("cleanup")
        const hasMaskSecrets = preprocessors.includes("maskSecrets")

        if (hasFriendlyErrors) {
            this.friendlyErrors(options, args)
        }

        // Stringify and clone objects?
        if (options.preprocessorOptions && options.preprocessorOptions.clone) {
            args = cloneDeep(args, options.levels.includes("debug"), options.maxDepth)
        }

        if (hasCleanup) {
            this.cleanupArray(options, args, 0)
        }
        if (hasMaskSecrets) {
            this.maskSecretsArray(options, args, 0)
        }

        return args
    }

    // CLEANUP
    // --------------------------------------------------------------------------

    /**
     * Cleanup logged parameters (arrays).
     * @param options Library options.
     * @param args Array to be processed.
     * @param depth Current depth on the array tree.
     */
    private cleanupArray = (options: AnyhowOptions, args: any[], depth: number): void => {
        for (let i = 0; i < args.length; i++) {
            const obj = args[i]
            /* istanbul ignore next */
            if (!obj) continue

            if (isArray(obj)) {
                if (depth == options.maxDepth) {
                    args[i] = "[...]"
                } else {
                    this.cleanupArray(options, obj, depth + 1)
                }
            } else if (isFunction(obj)) {
                args[i] = "[Function]"
            } else if (isObject(obj)) {
                if (Object.keys(obj).length == 0) {
                    args[i] = getTag(obj)
                } else {
                    this.cleanupObject(options, obj, depth + 1)
                }
            }
        }
    }

    /**
     * Cleanup logged parameters (objects).
     * @param options Library options.
     * @param obj Object to be processed.
     * @param depth Current depth on the objects tree.
     */
    private cleanupObject = (options: AnyhowOptions, obj: any, depth: number): void => {
        let entries = Object.entries(obj)
        let key: string
        let value: any

        for ([key, value] of entries) {
            if (isArray(value)) {
                this.cleanupArray(options, value, depth + 1)
            } else if (isFunction(obj)) {
                obj[key] = "[Function]"
            } else if (isObject(value)) {
                if (depth == options.maxDepth) {
                    obj[key] = "[...]"
                } else if (Object.keys(value).length == 0) {
                    obj[key] = getTag(value)
                } else {
                    this.cleanupObject(options, value, depth + 1)
                }
            } else if (isDate(value)) {
                obj[key] = value.toLocaleString()
            }
        }
    }

    // FRIENDLY ERRORS
    // --------------------------------------------------------------------------

    /**
     * Extract relevant details from known exceptions.
     * @param options Library options.
     * @param args Arguments to be processed.
     */
    private friendlyErrors = (options: AnyhowOptions, args: any[]): void => {
        for (let i = 0; i < args.length; i++) {
            const obj = args[i]
            /* istanbul ignore next */
            if (!obj || isString(obj)) continue

            let arrError: any[] = []
            let code: string
            let friendlyMessage: string
            let message: string

            // Typed error?
            if (isError(obj)) {
                code = obj.code || obj.statusCode
                friendlyMessage = obj.friendlyMessage || obj.reason
                message = obj.message || obj.description

                // Add error information separately.
                if (code) arrError.push(`Code ${code}`)
                if (friendlyMessage) arrError.push(friendlyMessage)
                if (message) arrError.push(message)
            }

            // Try extracting error details from axios / request exceptions.
            if (obj.response && obj.response.data) {
                try {
                    let dataMessage: string
                    let dataError: string

                    if (!code && obj.response.statusCode) {
                        arrError.push(`Code ${obj.response.statusCode}`)
                    }
                    if (obj.response.data.message) {
                        dataMessage = obj.response.data.message.toString()
                        if (dataMessage != "[object Object]" && dataMessage != message) {
                            arrError.push(dataMessage)
                        }
                    }
                    if (obj.response.data.error) {
                        dataError = (obj.response.data.error.message || obj.response.data.error).toString()
                        if (dataError != "[object Object]" && dataError != dataMessage && dataError != message) {
                            arrError.push(dataError)
                        }
                    }
                } catch (axiosEx) {}
            }

            if (arrError.length > 0) {
                if (options.preprocessorOptions && options.preprocessorOptions.errorStack && obj.stack) {
                    arrError.push(obj.stack.toString())
                }

                args[i] = arrError.join(options.separator)
            }
        }
    }

    // MASK SECRETS
    // --------------------------------------------------------------------------

    /**
     * Mask secrets (arrays).
     * @param options Library options.
     * @param args Array to be processed.
     * @param depth Current depth on the array tree.
     */
    private maskSecretsArray = (options: AnyhowOptions, args: any[], depth: number): void => {
        for (let i = 0; i < args.length; i++) {
            const obj = args[i]
            /* istanbul ignore next */
            if (!obj) continue

            if (isArray(obj)) this.maskSecretsArray(options, obj, depth + 1)
            else if (isObject(obj)) this.maskSecretsObject(options, obj, depth + 1)
        }
    }

    /**
     * Mask secrets (objects).
     * @param options Library options.
     * @param obj Object to be processed.
     * @param depth Current depth on the objects tree.
     */
    private maskSecretsObject = (options: AnyhowOptions, obj: any, depth: number): void => {
        const entries = Object.entries(obj)
        let key: string
        let value: any

        for ([key, value] of entries) {
            if (isArray(value)) {
                this.maskSecretsArray(options, value, depth + 1)
            } else if (isObject(value)) {
                this.maskSecretsObject(options, value, depth + 1)
            } else if (options.preprocessorOptions.maskedFields.includes(key)) {
                obj[key] = "[***]"
            }
        }
    }
}

// Exports...
export = AnyhowPreProcessors.Instance
