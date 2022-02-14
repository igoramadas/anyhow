// Anyhow: Utils (largely based on lodash.js)

import utilTypes from "util/types"

/**
 * Clone the passed object and return a new one.
 * @param obj The object to be cloned.
 * @param logErrors Log cloning failures? Defaults to false.
 * @param maxDepth Maximum depth to reach.
 * @param depth Current depth.
 */
export const cloneDeep = (obj: any, logErrors?: boolean, maxDepth?: number, depth?: number): any => {
    if (!obj) return obj
    if (!maxDepth) maxDepth = 5
    if (!depth) depth = 0

    let result

    try {
        if (isArray(obj)) {
            if (depth == maxDepth) {
                result = `[${obj.length}]`
            } else {
                result = []
                obj.forEach((element) => result.push(cloneDeep(element, logErrors, maxDepth, depth + 1)))
            }
        } else if (obj instanceof Object && !(obj instanceof Function)) {
            if (depth == maxDepth) {
                result = obj.toString()
            } else {
                try {
                    result = Object.assign(Object.create(Object.getPrototypeOf(obj)), obj)

                    if (isError(obj)) {
                        result.stack = obj.stack
                    }
                } catch (innerEx) {
                    if (logErrors) {
                        console.warn("Utils.cloneDeep: Failed to clone constructor")
                        console.error(innerEx)
                    }
                }
                if (!result) {
                    result = {}

                    for (let key in obj) {
                        if (key) result[key] = cloneDeep(obj[key], logErrors, maxDepth, depth + 1)
                    }
                }
            }
        } else {
            result = obj
        }
    } catch (ex) {
        if (logErrors) {
            console.warn("Utils.cloneDeep: Failed to clone object")
            console.error(ex)
        }
    }

    return result
}

/**
 * Returns a deduplicated array.
 * @param arr Array to be deduplicated (immutable).
 */
export const dedupArray = (arr: any[]): any[] => {
    if (!arr || arr.length == 0) return arr
    return arr.filter((item, index, self) => self.indexOf(item) == index)
}

/**
 * Flatten the passed array.
 * @param value Object or value.
 */
export const flattenArray = (array, depth?, result?): any[] => {
    const length = array == null ? 0 : array.length
    if (!length) return []

    if (isNil(depth)) depth = 1 / 0
    if (isNil(result)) result = []

    const predicate = (value) => Array.isArray(value) || isArguments(value) || !!(value && value[Symbol.isConcatSpreadable])

    if (array == null) {
        return result
    }

    for (const value of array) {
        if (depth > 0 && predicate(value)) {
            if (depth > 1) {
                flattenArray(value, depth - 1, result)
            } else {
                result.push(...value)
            }
        } else {
            result[result.length] = value
        }
    }

    return result
}

/**
 * Get the passed object's tag.
 * @param value Object or value.
 */
export const getTag = (value) => {
    const toString = Object.prototype.toString

    if (value === null) {
        return "[object Null]"
    }
    if (value === undefined) {
        return "[object Undefined]"
    }

    if (value && value.constructor && value.constructor.name) {
        return `[object ${value.constructor.name}]`
    }

    return toString.call(value)
}

/**
 * Get the current timestamp.
 */
export const getTimestamp = (): string => {
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

    return `${padLeft(year.substring(2))}-${padLeft(month)}-${padLeft(day)} ${padLeft(hour)}:${padLeft(minute)}:${padLeft(second)}`
}

/**
 * Check if the passed value is same as args.
 * @param value Object or value.
 */
export const isArguments = (value): boolean => {
    return isObject(value) && getTag(value) == "[object Arguments]"
}

/**
 * Check if the passed value is an array.
 * @param value Object or value.
 */
export const isArray = (value): boolean => {
    return value && Array.isArray(value)
}

/**
 * Check if the passed value is a date.
 * @param value Object or value.
 */
export const isDate = (value): boolean => {
    return utilTypes.isDate(value)
}

/**
 * Check if the passed value is an error.
 * @param value Object or value.
 */
export const isError = (value): boolean => {
    if (!isObject(value)) {
        return false
    }

    const tag = getTag(value)
    return tag == "[object Error]" || tag == "[object DOMException]" || (typeof value.message === "string" && typeof value.name === "string" && !isPlainObject(value))
}

/**
 * Check if the passed value is a string.
 * @param value Object or value.
 */
export const isFunction = (value): boolean => {
    return typeof value === "function"
}

/**
 * Check if the passed value is null or undefined.
 * @param value Object or value.
 */
export const isNil = (value): boolean => {
    return value === null || typeof value == "undefined"
}

/**
 * Check if the passed value is an object.
 * @param value Object or value.
 */
export const isObject = (value): boolean => {
    return typeof value === "object" && value !== null
}

/**
 * Check if the passed value is a plain object.
 * @param value Object or value.
 */
export const isPlainObject = (value): boolean => {
    if (!isObject(value) || getTag(value) != "[object Object]") {
        return false
    }

    if (Object.getPrototypeOf(value) === null) {
        return true
    }

    let proto = value
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto)
    }

    return Object.getPrototypeOf(value) === proto
}

/**
 * Check if the passed value is a string.
 * @param value Object or value.
 */
export const isString = (value): boolean => {
    const type = typeof value
    return type === "string" || (type === "object" && value != null && !Array.isArray(value) && getTag(value) == "[object String]")
}

/**
 * Merge the passed / immutable objects into one, and return the result.
 * @param obj The object to be cloned.
 */
export const mergeDeep = (...objects: any[]): any => {
    if (!objects) return objects

    let mergeArrays = false

    if (objects[objects.length - 1] === true) {
        mergeArrays = true
        objects.pop()
    }

    return objects.reduce((prev: any, obj: any) => {
        Object.keys(obj).forEach((key) => {
            const previous = prev[key]
            const current = obj[key]

            if (isArray(previous) && isArray(current)) {
                prev[key] = mergeArrays ? previous.concat(...current) : current
            } else if (isObject(previous) && isObject(current)) {
                prev[key] = mergeDeep(previous, current)
            } else {
                prev[key] = current
            }
        })

        return prev
    }, {})
}
