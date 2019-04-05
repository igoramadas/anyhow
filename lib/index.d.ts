declare class Anyhow {
    private static _instance;
    static readonly Instance: Anyhow;
    readonly isReady: boolean;
    private _log;
    compact: boolean;
    separator: string;
    styles: object;
    preprocessor: Function;
    log(level: string, args: any | any[]): string;
    debug(...args: any[]): string;
    info(...args: any[]): string;
    warn(...args: any[]): string;
    error(...args: any[]): string;
    console(level: string, args: any): string;
    setup(lib?: string | any, options?: any): void;
    getMessage(originalArgs: any | any[]): string;
}
declare const _default: Anyhow;
export = _default;
