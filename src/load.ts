// Anyhow: runtime module loader (CJS + ESM compatible)

import {createRequire} from "module"
import {join} from "path"

/**
 * Resolve a require() function that works in both the CommonJS and ESM builds.
 * Uses __filename when available (CJS), otherwise falls back to the process cwd.
 */
const runtimeRequire: NodeRequire = (() => {
    try {
        return createRequire(eval("__filename"))
    } catch {
        return createRequire(join(process.cwd(), "package.json"))
    }
})()

/**
 * Load an optional dependency. Throws if the module cannot be resolved,
 * matching the behaviour of a normal require() call.
 */
export const loadModule = (id: string): any => {
    return runtimeRequire(id)
}
