// Anyhow: preprocessors

import {AnyhowOptions, PreProcessor} from "./types"
import {getTag, isArray, isError, isFunction, isObject} from "./utils"
import {isDate} from "util/types"

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
    run = (options: AnyhowOptions, args: any[], preprocessors: PreProcessor[]): void => {
        const hasCleanup = preprocessors.includes("cleanup")
        const hasFriendlyErrors = preprocessors.includes("friendlyErrors")
        const hasMaskSecrets = preprocessors.includes("maskSecrets")

        if (hasFriendlyErrors) {
            this.friendlyErrors(options, args)
        }

        for (let i = 0; i < args.length; i++) {
            const obj = args[i]
            if (!obj) continue

            if (isArray(obj)) {
                if (hasCleanup) this.cleanupArray(options, obj, 0)
                if (hasMaskSecrets && options.preprocessorOptions.maskedFields) this.maskSecretsArray(options, obj, 0)
            } else if (isObject(obj)) {
                if (hasCleanup) this.cleanupObject(options, obj, 0)
                if (hasMaskSecrets && options.preprocessorOptions.maskedFields) this.maskSecretsObject(options, obj, 0)
            }
        }
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
            if (!obj) continue

            if (isError(obj)) {
                const arrError: any[] = []
                const friendlyMessage = obj.friendlyMessage || obj.reason
                const code = obj.code || obj.statusCode
                const message = obj.message || obj.description

                // Add error information separately.
                if (friendlyMessage) arrError.push(friendlyMessage)
                if (code) arrError.push(code)
                if (message) arrError.push(message)

                // Try extracting error details from axios exceptions.
                if (obj.response && obj.response.data) {
                    try {
                        if (obj.response.data.message) {
                            const dataMessage = obj.response.data.message.toString()
                            if (dataMessage != "[object Object]") arrError.push(obj.response.data.message.toString())
                        }
                        if (obj.response.data.error) {
                            const dataError = obj.response.data.error.toString()
                            if (dataError != "[object Object]") arrError.push(obj.response.data.error.toString())
                        }
                    } catch (axiosEx) {}
                }

                // Append stack?
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
