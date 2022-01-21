# Changelog for Anyhow

3.0.0
=====
* BREAKING! Library options now contained within the new logger.options property.
* NEW! A few new logging helpers:
    - deprecated: logs a deprecation warning (only once)
    - inspect: outputs the JSON representation of the  passed objects / variables
* NEW! Built-in preprocessors:
    - cleanup: remove unnecessary gibberish from logged objects
    - friendlyErrors: extract the most relevant data from error and exceptions
    - maskSecrets: mask passwords, tokens and credentials on objects

2.2.5
=====
* Updated dependencies.

2.2.4
=====
* Updated dependencies.

2.2.3
=====
* Updated dependencies.

2.2.2
=====
* Removed lodash references from testing.

2.2.1
=====
* Updated dependencies.

2.2.0
=====
* Improved error parsing.
* Removed lodash dependency.

2.1.0
=====
* The chalk module will only be instantiated if using console as the logger.
* Updated dependencies.

2.0.6
=====
* Updated dependencies.

2.0.5
=====
* The parser.getMessage() helper is now exposed on the main module.

2.0.3
=====
* Updated dependencies.

2.0.2
=====
* Updated dependencies.

2.0.1
=====
* Updated dependencies.

2.0.0
=====
* NEW! Support for Google Cloud Logging (formely Stackdriver).
* NEW! Support for custom loggers.
* Major code refactoring.

1.5.5
=====
* Improved parsing of errors, now getting message from axios responses.
* Updated dependencies.

1.5.3
=====
* Updated dependencies.

1.5.1
=====
* Force flatten arrays on getMessage().

1.5.0
=====
* TypeScript types are now exported with the library.

1.4.2
=====
* Updated dependencies.

1.4.1
=====
* Updated dependencies.

1.4.0
=====
* NEW! Option unhandledRejections to auto log unhandled rejections, defaults to false.
* NEW! Option appName to define the name or title of the running app.
* Updated dependencies.

1.3.0
=====
* NEW! Option timestamp to prepend timestamp on logged messages.
* Updated dependencies.

1.2.3
=====
* Updated dependencies.

1.2.2
=====
* Check for level on log shortcuts (debug, info, warn, error).

1.2.1
=====
* Option levelOnConsole also works when messages are stylized (using chalk).

1.2.0
=====
* NEW! Option uncaughtExceptions to auto log uncaught exceptions, defaults to false.
* NEW! Option levelOnConsole to output log level to console, defaults to false.

1.1.3
=====
* Removed .git from package.

1.1.2
=====
* Calling log() before setup() will warn and default to console.

1.1.1
=====
* Updated dependencies.

1.1.0
=====
* NEW! Added supoort for Pino.
* NEW! Propery "lib" defining the underlying library.

1.0.0
=====
* Initial release.
