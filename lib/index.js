"use strict";
const _ = require("lodash");
let chalk = null;
class Anyhow {
    constructor() {
        this.compact = true;
        this.separator = " | ";
        this.styles = {
            debug: ["gray"],
            info: ["white"],
            warn: ["yellow"],
            error: ["red", "bold"]
        };
    }
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
    get isReady() {
        if (this._log) {
            return true;
        }
        return false;
    }
    log(level, args) {
        let message = _.isString(args) ? args : this.getMessage(args);
        this._log(level, message);
        return message;
    }
    debug(...args) {
        if (args.length < 1)
            return;
        let params = Array.from(arguments);
        let message = this.getMessage(params);
        return this.log("debug", message);
    }
    info(...args) {
        if (args.length < 1)
            return;
        let params = Array.from(arguments);
        let message = this.getMessage(params);
        return this.log("info", message);
    }
    warn(...args) {
        if (args.length < 1)
            return;
        let params = Array.from(arguments);
        let message = this.getMessage(params);
        return this.log("warn", message);
    }
    error(...args) {
        if (args.length < 1)
            return;
        let params = Array.from(arguments);
        let message = this.getMessage(params);
        return this.log("error", message);
    }
    console(level, args) {
        let message = _.isString(args) ? args : this.getMessage(args);
        let styledMessage = message;
        let logMethod = console.log;
        if (console[level] && level != "debug") {
            logMethod = console[level];
        }
        if (chalk) {
            let styles = this.styles[level];
            let chalkStyle;
            if (styles) {
                chalkStyle = chalk;
                for (let s of styles) {
                    chalkStyle = chalkStyle[s];
                }
            }
            else {
                chalkStyle = chalk.white;
            }
            styledMessage = chalkStyle(message);
        }
        logMethod(styledMessage);
        return message;
    }
    setup(lib, options) {
        let found = false;
        let winston, bunyan;
        lib = lib || "console";
        options = options || {};
        if (lib == "none") {
            this._log = function () {
                return false;
            };
            return;
        }
        if (_.isObject(lib)) {
            if (lib.constructor.name == "DerivedLogger" && lib.format && lib.level) {
                winston = lib;
                lib = "winston";
            }
            else if (lib.constructor.name == "Logger" && lib.fields && lib._events) {
                bunyan = lib;
                lib = "bunyan";
            }
        }
        if (lib == "winston") {
            try {
                if (!winston) {
                    winston = require("winston");
                }
                this._log = function (level, message) {
                    winston.log({ level: level, message: message });
                };
                found = true;
            }
            catch (ex) {
                console.error("Anyhow", "Could not load winston", ex);
            }
        }
        if (lib == "bunyan") {
            try {
                if (!options.name) {
                    options.name = "Anyhow";
                }
                if (!bunyan) {
                    bunyan = require("bunyan").createLogger(options);
                }
                this._log = function (level, message) {
                    bunyan[level](message);
                };
                found = true;
            }
            catch (ex) {
                console.error("Anyhow", "Could not load bunyan", ex);
            }
        }
        if (!found) {
            try {
                if (!chalk) {
                    chalk = require("chalk");
                }
            }
            catch (ex) { }
            this._log = (level, message) => this.console(level, message);
        }
    }
    getMessage(originalArgs) {
        let value;
        let separated = [];
        let args = [];
        if (arguments.length > 1) {
            for (value of Array.from(arguments)) {
                args.push(_.cloneDeep(value));
            }
        }
        else if (_.isArray(originalArgs)) {
            for (value of Array.from(originalArgs)) {
                args.push(_.cloneDeep(value));
            }
        }
        else if (_.isError(originalArgs)) {
            args.push(originalArgs);
        }
        else {
            args.push(_.cloneDeep(originalArgs));
        }
        if (this.preprocessor) {
            let processedArgs = this.preprocessor(args);
            args = processedArgs ? processedArgs : args;
        }
        for (let arg of Array.from(args)) {
            try {
                if (arg != null) {
                    let stringified = "";
                    try {
                        if (_.isArray(arg)) {
                            for (value of Array.from(arg)) {
                                stringified += JSON.stringify(value, null, 2);
                            }
                        }
                        else if (_.isError(arg)) {
                            const arrError = [];
                            if (arg.friendlyMessage != null) {
                                arrError.push(arg.friendlyMessage);
                            }
                            if (arg.reason != null) {
                                arrError.push(arg.reason);
                            }
                            if (arg.code != null) {
                                arrError.push(arg.code);
                            }
                            arrError.push(arg.message);
                            arrError.push(arg.stack);
                            stringified = arrError.join(this.separator);
                        }
                        else if (_.isObject(arg)) {
                            stringified = JSON.stringify(arg, null, 2);
                        }
                        else {
                            stringified = arg.toString();
                        }
                    }
                    catch (ex) {
                        stringified = arg.toString();
                    }
                    if (this.compact) {
                        stringified = stringified.replace(/(\r\n|\n|\r)/gm, "").replace(/  +/g, " ");
                    }
                    separated.push(stringified);
                }
            }
            catch (ex) {
                console.error("Anyhow.getMessage", ex);
            }
        }
        return separated.join(this.separator);
    }
}
module.exports = Anyhow.Instance;
