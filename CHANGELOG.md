# Changelog for Anyhow

## 4.0.0

- NEW: Native ESM support via package exports, alongside CommonJS.
- NEW: Option `levelMap` to map Anyhow log levels to levels supported by the configured logger or console.
- `debug()` now logs the full JSON of passed objects, with only the `maskSecrets` preprocessor applied.
- BREAKING: Requires Node.js 22 or newer.

## 3.4.0

- Check for an additional "errors" array when getting friendly error messages.

## 3.3.0

- Expanded the list of masked fields.
- Masked field keys are now case insensitive.
- Default `maxDepth` increased from 6 to 10.
- Code refactoring.

## 3.2.0

- Removed pre v3 deprecated methods.
- Default `maxDepth` increased from 5 to 6.

## 3.1.1

- Removed "sneaky" TEST log.

## 3.1.0

- Fixed timestamp feature (was being added multiple times).
- Fixed default Google Cloud logger.

## 3.0.4

- Removed the "util/types" dependency on utils.
- The `errorStack` was pointing to the wrong location, now fixed (`preprocessorOptions.errorStack`).

## 3.0.2

- Added "Authorization" to list of default masked fields.
- Handling improvements to the "cleanup" and "friendlyErrors" preprocessors.
- The "friendlyErrors" preprocessor is ignored on debug and info logs.

## 3.0.1

- Added missing default separator, switched back from "," to " | ".

## 3.0.0

- Major code refactoring!
- BREAKING: Library options now contained within the new `logger.options` property.
- NEW: A few new logging helpers:
    - `deprecated()`: logs a deprecation warning (only once).
    - `inspect()`: outputs the JSON representation of the passed objects / variables.
- NEW: Built-in preprocessors:
    - `cleanup`: remove unnecessary gibberish from logged objects.
    - `friendlyErrors`: extract the most relevant data from error and exceptions.
    - `maskSecrets`: mask passwords, tokens and credentials on objects.

## 2.2.2

- Removed lodash references from testing.

## 2.2.0

- Improved error parsing.
- Removed lodash dependency.

## 2.1.0

- The chalk module will only be instantiated if using console as the logger.

## 2.0.5

- The `parser.getMessage()` helper is now exposed on the main module.

## 2.0.0

- NEW: Support for Google Cloud Logging (formerly Stackdriver).
- NEW: Support for custom loggers.
- Major code refactoring.

## 1.5.5

- Improved parsing of errors, now getting message from axios responses.

## 1.5.1

- Force flatten arrays on `getMessage()`.

## 1.5.0

- TypeScript types are now exported with the library.

## 1.4.0

- NEW: Option `unhandledRejections` to auto log unhandled rejections, defaults to false.
- NEW: Option `appName` to define the name or title of the running app.

## 1.3.0

- NEW: Option `timestamp` to prepend timestamp on logged messages.

## 1.2.2

- Check for level on log shortcuts (debug, info, warn, error).

## 1.2.1

- Option `levelOnConsole` also works when messages are stylized (using chalk).

## 1.2.0

- NEW: Option `uncaughtExceptions` to auto log uncaught exceptions, defaults to false.
- NEW: Option `levelOnConsole` to output log level to console, defaults to false.

## 1.1.3

- Removed `.git` from package.

## 1.1.2

- Calling `log()` before `setup()` will warn and default to console.

## 1.1.0

- NEW: Added support for Pino.
- NEW: Property `lib` defining the underlying library.

## 1.0.0

- Initial release.
