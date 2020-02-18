# Changelog for Anyhow

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
