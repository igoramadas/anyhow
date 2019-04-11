# Anyhow

[![Build Status](https://img.shields.io/travis/igoramadas/anyhow.svg?style=flat-square)](https://travis-ci.org/igoramadas/anyhow)
[![Coverage Status](https://img.shields.io/coveralls/github/igoramadas/anyhow.svg?style=flat-square)](https://coveralls.io/github/igoramadas/anyhow?branch=master)

Drop-in logging wrapper for Winston, Bunyan and console. Let the user decide which one he prefers :-)

## Basic usage

```javascript
const logger = require("anyhow")

// Use defaults: will try loading Winston, then Bunyan, and fall back to console
logger.setup()

// Log some information
logger.info("My app has started")

// Mix and match arguments
logger.info({someJson: "text"}, "Some string", 123)

// Log exceptions
try {
    oops.itFailed()
} catch (ex) {
    logger.error(ex)
}
```

## Enforcing a specific library

```javascript
// Use Winston default logger
logger.setup("winston")

// Or pass the Winston logger directly.
const winstonLogger = winston.createLogger(options)
logger.setup(winstonLogger)

// Same for Bunyan
logger.setup("bunyan")

// Or...
const bunyanLogger = bunyan.createLogger(options)
logger.setup(bunyanLogger)

// Enforce using the console
logger.setup("console")

// Disable logging
logger.setup("none")
```

## Changing default settings

```javascript
// Separate logged arguments with a comma instead of default |
logger.separator = ", "

// Outputs "This is, now separated, by comma"
logger.info("This is", "now separated", "by comma")

// Do not compact messages
logger.compact = false

// Logged output will contain JSON with spaces and line breaks
logger.info(someDeepObject)

// Make warn messages red and italic instead of default yellow
logger.styles.warn = ["red", "italic"]
logger.warn("Console output now shows yellow italic for this")
logger.info("Info is still default gray")
```

## Logging exceptions

```javascript
try {
    // Some exception thrown
    myApp.method(fails)
} catch (ex) {
    // User's password and token won't be loggged
    logger.error("MyApp.MyMethod", ex)

    // Do not log the stack trace by settting a _logNoStack flag.
    ex._logNoStack = true
    logger.error("MyApp.MyMethod", ex)
}
```

## Pre-processing logged messages

```javascript
// Sample user object
const user = {
    name: "John Doe",
    password: "mypass",
    token: "sometoken"
}

// Remove passwords and tokens from logged objects
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

// User's password and token won't be loggged
logger.info(user)

// User was not mutated, logger will deep clone before logging
console.dir(user)
```

## API documentation

You can browse the full API documentation at https://anyhow.devv.com.

Or check these following modules that are using Anyhow for logging:

* [Monitorado](https://travis-ci.org/igoramadas/monitorado)
* [SetMeUp](https://travis-ci.org/igoramadas/setmeup)
