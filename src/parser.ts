// Anyhow: Helpers

import _ from "lodash"

/**
 * Parser methods to build a message out of passed logging arguments.
 */
class AnyhowParser {
    private static _instance: AnyhowParser
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Compact logged messages?
     */
    compact: boolean = true

    /**
     * Prepend logged messages with a timestamp?
     */
    timestamp: boolean = false

    /**
     * Log error stack traces?
     */
    errorStack: boolean = false

    /**
     * Arguments seperator on messages.
     */
    separator: string = " | "

    /**
     * Function to pre-process arguments.
     */
    preprocessor: Function

    /**
     * Used by [[getMessage]] to parse and return the individual log strings
     * out of the passed arguments. Might run recursively.
     * @param args Array of arguments to be parsed.
     */
    private argumentsParser = (args: any[]): string[] => {
        let result = []

        // Parse all arguments and stringify objects. Please note that fields defined
        // on the `removeFields` setting won't be added to the message.
        for (let arg of args) {
            try {
                if (arg != null) {
                    let stringified = ""

                    try {
                        if (_.isArray(arg)) {
                            result = result.concat(this.argumentsParser(arg))
                        } else if (_.isError(arg)) {
                            const arrError = []

                            // Add error information separately.
                            if (arg.friendlyMessage) {
                                arrError.push(arg.friendlyMessage)
                            }
                            if (arg.reason) {
                                arrError.push(arg.reason)
                            }
                            if (arg.code) {
                                arrError.push(arg.code)
                            }

                            /* istanbul ignore else */
                            if (arg.message) {
                                arrError.push(arg.message)
                            }

                            // Errors from axios.
                            if (arg.response && arg.response.data) {
                                if (arg.response.data.message) {
                                    arrError.push(arg.response.data.message.toString())
                                }
                                if (arg.response.data.error) {
                                    arrError.push(arg.response.data.error.toString())
                                }
                            }

                            // Only add stack traces if `errorStack` is set.
                            if (arg.stack && this.errorStack) {
                                arrError.push(arg.stack)
                            }

                            stringified = arrError.join(this.separator)
                        } else if (_.isObject(arg)) {
                            stringified = JSON.stringify(arg, null, 2)
                        } else {
                            stringified = arg.toString()
                        }
                    } catch (ex) {
                        /* istanbul ignore next */
                        stringified = arg.toString()
                    }

                    // Check if a valid message was taken, and if it needs to be compacted.
                    /* istanbul ignore else */
                    if (typeof stringified != "undefined" && stringified !== null) {
                        if (this.compact) {
                            stringified = stringified.replace(/(\r\n|\n|\r)/gm, "").replace(/  +/g, " ")
                        }

                        result.push(stringified)
                    }
                }
            } catch (ex) {
                /* istanbul ignore next */
                console.error("Anyhow.argumentsParser", ex)
            }
        }

        return result
    }

    /**
     * Gets a nice, readable message out of the passed arguments, which can be of any type.
     * @param args Any single or collection of objects that will be transformed to a message string.
     * @returns Human readable string taken out of the parsed arguments.
     */
    getMessage = (...args: any | any[]): string => {
        if (!_.isArray(args)) {
            /* istanbul ignore next */
            args = [args]
        }

        args = _.flattenDeep(args)

        // Add timestamp to the output?
        if (this.timestamp) {
            const padLeft = (v) => {
                return v < 10 ? "0" + v.toString() : v.toString()
            }

            // Get date elements.
            const now = new Date()
            let year: any = now.getUTCFullYear().toString()
            let month: any = now.getUTCMonth() + 1
            let day: any = now.getUTCDate()
            let hour: any = now.getUTCHours()
            let minute: any = now.getUTCMinutes()
            let second: any = now.getUTCSeconds()

            // Append timestamp to the message.
            let timestamp = `${padLeft(year.substring(2))}-${padLeft(month)}-${padLeft(day)} ${padLeft(hour)}:${padLeft(minute)}:${padLeft(second)}`
            args.unshift(timestamp)
        }

        // If the preprocessor returns a value, use it as the new args.
        if (this.preprocessor) {
            let processedArgs = this.preprocessor(args)
            args = processedArgs ? processedArgs : args
        }

        // Return single string log message.
        return this.argumentsParser(args).join(this.separator)
    }
}

// Exports...
export = AnyhowParser.Instance
