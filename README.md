# Anyhow

[![Version](https://img.shields.io/npm/v/anyhow.svg)](https://npmjs.com/package/anyhow)
[![Build Status](https://img.shields.io/travis/igoramadas/anyhow.svg)](https://travis-ci.org/igoramadas/anyhow)
[![Coverage Status](https://img.shields.io/coveralls/github/igoramadas/anyhow.svg)](https://coveralls.io/github/igoramadas/anyhow?branch=master)

Drop-in logging wrapper for [Winston](https://www.npmjs.com/package/winston), [Bunyan](https://www.npmjs.com/package/bunyan), [pino](https://www.npmjs.com/package/pino), [Google Cloud Logging](https://github.com/googleapis/nodejs-logging) and [console](https://nodejs.org/api/console.html).

## Why?

The idea for Anyhow came after a conflict of interests regarding logging libraries on some of my personal and work projects. Some were using winston. A few other went for bunyan. Some were simply streaming to the console.

By using Anyhow we can achieve a consistent logging mechanism regardless of what library is actually doing the logging. Install Anyhow, replace the log calls and let it delegate the actual logging to the correct library. It also has some handy features like compacting the messages, pre-processing arguments and stylizing the console output.

## Basic usage

```javascript
const logger = require("anyhow")

// Setup passing no arguments will default to the console.
logger.setup()

// Log some text.
logger.info("My app has started")

// Mix and match arguments.
logger.info({someJson: "text"}, "Some string", 123)

// Log exceptions.
try {
    oops.itFailed()
} catch (ex) {
    logger.error("MyApp.method", ex)
}

// By default "debug" level is disabled, so this won't log anything.
logger.debug("Debug something", myObject)

// Enable only warn and error logging.
logger.levels = ["warn", "error"]

// Now info calls won't do anything.
logger.info("Won't log because we only enabled warn and error")
logger.warn("This warn will be logged")

// You can also call the .log method directly, passing level as the first argument.
// Useful when using custom loggers.
logger.log("info", "This will be called as info", someExtraObject, 123)
```

### Enforcing a specific library

```javascript
// Use winston default logger.
logger.setup("winston")

// Or pass the winston logger directly.
const winstonLogger = require("winston").createLogger(options)
logger.setup({name: "winston", instance: winstonLogger})

// Same for bunyan.
logger.setup("bunyan")

// Or...
const bunyanLogger = require("bunyan").createLogger(options)
logger.setup({name: "winston", instance: bunyanLogger})

// Also pino.
logger.setup("pino")

// And Google Cloud Logging. Log name will default to the appName, lowercased and with no spaces.
logger.setup("gcloud")

// Please note that Google Cloud Logging expects the default credentials set up on the machine.
// If you haven't configured the Google Cloud SDK or credentials on the machine, you must
// provide the authentication options during setup.
const googleOptions = {
    logName: "anyhow-testing",
    projectId: env.GCP_PROJECT_ID,
    credentials: {
        client_email: env.GCP_CLIENT_EMAIL,
        private_key: env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n")
    }
}
logger.setup("gcloud", googleOptions)

// Disable logging.
logger.setup("none")
```

### Changing default settings

```javascript
// Separate logged arguments with a ", " comma instead of default " | " pipe.
logger.separator = ", "

// Outputs "This is, now separated, by comma".
logger.info("This is", "now separated", "by comma")

// Do not compact messages (default is compact = true).
logger.compact = false

// Logged output will contain JSON with spaces and line breaks.
logger.info(someComplexObject, somethingElse)

// Make warn messages red and italic instead of default yellow (depends on "chalk" module).
logger.styles.warn = ["red", "italic"]
logger.warn("Console output now shows yellow italic for this")
logger.info("Info is still default gray")

// Disable styling.
logger.styles = null
logger.warn("No console styles anymore, even if chalk is installed")

// Prepend log level on the console.
logger.levelOnConsole = true
logger.info("This will now have 'INFO:' on the beginning of the message")

try {
    // Some exception thrown.
    myApp.method(fails)
} catch (ex) {
    // By default the stack trace is not logged...
    logger.error("error without stack trace", ex)

    // Include stack trace by setting errorStack = true.
    logger.errorStack = true
    logger.error("error with stack trace", ex)
}
```

### Pre-processing logged messages

```javascript
// Sample user object.
const user = {
    name: "John Doe",
    password: "mypass",
    token: "sometoken"
}

// No preprocessor by default, will log all user data.
logger.info(user)

// Add preprocessor to remove passwords and tokens from logged objects.
logger.preprocessor = function(args) {
    for (let a of args) {
        if (a && a.password) {
            delete a.password
        } else if (a && a.token) {
            delete a.token
        }
    }
    return args
}

// User's password and token won't be loggged.
logger.info(user)

// User was not mutated, as it will deep clone before logging.
console.dir(user)
```

### Uncaught and unhandled errors

```javascript
// Enable the uncaught exceptions handled.
logger.uncaughtExceptions = true

// Throw some exception.
// Will log the "Not a function" exception to the current transport.
// Code will not execute from here, but exception was logged to the console.
let notFunction = true
notFunction()

// Also for unhandled rejections.
logger.unhandledRejections = true

// Here a sample of unhandled rejection.
let failFunction = async function() {
    throw new Error("Oh no!")
}
// Will log the unhandled rejection.
failFunction()

```

## Version 2 breaking changes

If you were using Anyhow and passing a logger instance directly on `setup()`, you'll need to update the call to the new signature.

```javascript
// From...
anyhow.setup(myWinstonLogger)
// To...
anyhow.setup({name: "winston", instance: myWinstonLogger})
```

## Options

#### compact: true

Boolean, defines if messages should be compacted, so line breaks and extra spaces will be removed.

#### errorStack: false

Boolean, defines if stack traces should be logged with errors and exceptions.

#### levels: ["info", "warn", "error"]

Array of string, defines which logging levels are enabled. Possible logging levels are
["info", "warn", "error"].

#### levelOnConsole: false

Boolean, if true it will prepend the log level (INFO, WARN, ERROR etc...) to the message on the console.

#### uncaughtException: false

Boolean, if true it will log uncaught exceptions to the console (but will NOT quit execution).

#### preprocessor(args)

You can define a function(arrayOfObjects) that will be used to process arguments before generating
the final log messages. This is useful if you want to change or remove information from objects, for
instance you might want to obfuscate all `password` fields and mask `telephone` fields. The function
can either mutate the arrayOfObjects or return the new arguments as a result.

#### separator: " | "

String, defines the default separator between logged objects. For instance if you do a
`info(123, "ABC")`, output will be "123 | ABC".

#### styles: object

Object with keys defining the styles for each level on console output. This will only be effective
if you also have the [chalk](https://www.npmjs.com/package/chalk) module installed. By default
`debug` is gray, `info` is white, `warn` is yellow and `error` is bold red.

## Methods

#### console(level, args) -> string

Log to console directly, regardless of which library is currently active. First argument is
the `level` string, and second is array of things to be logged.
Returns the final, parsed message that was logged.

#### log(level, args) -> string

Main logging method. First argument is the `level` string, and second is array of things to be logged.
Please note that only "info", "warn" and "error" levels are enabled by default.
Returns the final, parsed message that was logged.

#### debug(...args) -> string

Shortcut to log("debug", args). Please note that "debug" is not included on the default `levels`.

#### info(...args) -> string

Shortcut to log("info", args).

#### warn(...args) -> string

Shortcut to log("warn", args).

#### error(...args) -> string

Shortcut to log("error", args).

## API documentation

You can browse the full API documentation at https://anyhow.devv.com.

Or check these following projects that are using Anyhow for logging:

* [Expresser](https://github.com/igoramadas/expresser)
* [Monitorado](https://github.com/igoramadas/monitorado)
* [SetMeUp](https://github.com/igoramadas/setmeup)
* [PandaGainz](https://github.com/igoramadas/pandagainz)
* [Strautomator](https://github.com/strautomator/core)
