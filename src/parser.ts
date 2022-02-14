// Anyhow: Parser

import {AnyhowOptions, PreProcessor} from "./types"
import {flattenArray, getTimestamp, isArray, isFunction, isNil, isObject, isString} from "./utils"
import preprocessors from "./preprocessors"
import util from "util"

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
        this._options = value

        if (value.preprocessors && isArray(value.preprocessors)) {
            this.builtinPreProcessors = value.preprocessors.filter((pp) => isString(pp)) as string[]
            this.customPreProcessors = value.preprocessors.filter((pp) => isFunction(pp)) as Function[]
        } else {
            this.builtinPreProcessors = []
            this.customPreProcessors = []
        }

        this._isDebug = this.options.levels.includes("debug")
    }

    /**
     * Is the "debug" level active?
     */
    private _isDebug: boolean

    /**
     * Is the "debug" level active?
     */
    get isDebug(): boolean {
        return this._isDebug
    }

    /**
     * List of active built-in preprocessors.
     */
    private builtinPreProcessors: string[] = []

    /**
     * List of active custom preprocessors.
     */
    private customPreProcessors: Function[] = []

    // METHODS
    // --------------------------------------------------------------------------

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
                        if (isObject(arg)) {
                            stringified = JSON.stringify(arg, null, 2)
                        } else {
                            stringified = arg.toString()
                        }
                    } catch (ex) {
                        /* istanbul ignore next */
                        stringified = arg.toString()
                    }

                    // Compact the output message?
                    if (stringified && this.options.compact) {
                        stringified = stringified.replace(/(\r\n|\n|\r)/gm, "").replace(/  +/g, " ")
                    }

                    result.push(stringified)
                }
            } catch (ex) {
                /* istanbul ignore next */
                if (this.isDebug) {
                    console.error("Anyhow.argumentsParser: failed to parse arguments")
                    console.error(ex)
                }
            }
        }

        return result
    }

    /**
     * Gets a nice, readable message out of the passed arguments, which can be of any type.
     * @param args Objects or variables that should be stringified.
     * @param ignoredPreProcessors List of ignored preprocessors.
     * @returns Human readable string taken out of the parsed arguments.
     */
    getMessage = (args: any[], ignoredPreProcessors?: PreProcessor[]): string => {
        let strMessage: string = null

        if (isNil(args)) {
            strMessage = ""
        } else {
            if (!isArray(args)) {
                args = [args]
            }
            if (args.length == 1 && isString(args[0])) {
                strMessage = args[0]
            }
        }

        if (strMessage !== null) {
            if (this.options.timestamp) {
                strMessage = `${getTimestamp()}${this.options.separator}${strMessage}`
            }

            return strMessage
        }

        try {
            const builtinPreProcessors = this.builtinPreProcessors.filter((pp: any) => (ignoredPreProcessors ? ignoredPreProcessors.includes(pp) : true))
            const customPreProcessors = this.customPreProcessors

            // Flatten the array if the compact option is set.
            if (this.options.compact) {
                args = flattenArray(args)
            }

            // Execute built-in preprocessors (if any).
            if (this.builtinPreProcessors.length > 0) {
                args = preprocessors.run(this.options, args, builtinPreProcessors as PreProcessor[])
            }

            // Execute custom preprocessors (if any).
            for (let pp of customPreProcessors) {
                try {
                    args = pp(args) || args
                } catch (ex) {
                    if (this.isDebug) {
                        console.error("Anyhow: failed to execute custom preprocessor")
                        console.error(ex)
                    }
                }
            }

            const messages = this.argumentsParser(args)

            // Add timestamp?
            if (this.options.timestamp) {
                messages.unshift(getTimestamp())
            }

            // Return single string log message.
            return messages.join(this.options.separator)
        } catch (ex) {
            /* istanbul ignore next */
            if (this.isDebug) {
                console.error("Anyhow.getMessage: failed to generate message")
                console.error(ex)
            }
        }
    }

    /**
     * Gets a nice, readable JSON representation of the passed arguments.
     * @param args Objects or variables that should be stringified.
     */
    getInspection = (args: any): string => {
        const result: string[] = []

        const options = {
            compact: false,
            colors: true,
            depth: this.options.maxDepth,
            showHidden: false
        }

        // Add timestamp?
        if (this.options.timestamp) {
            result.push(getTimestamp())
        }

        // Iterate and process the passed arguments.
        for (let obj of args) {
            let objType: string

            if (obj) {
                if (obj.constructor && obj.constructor.name) {
                    objType = obj.constructor.name
                } else {
                    objType = Object.prototype.toString.call(obj).match(/^\[object\s(.*)\]$/)[1]
                }
                result.push(`${objType}\n${"-".repeat(objType.length)}`)
            }

            result.push(util.inspect(obj, options))
        }

        return result.join("\n")
    }
}

// Exports...
export = AnyhowParser.Instance
