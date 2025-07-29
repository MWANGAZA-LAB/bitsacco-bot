interface Logger {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
    stream: {
        write: (message: string) => void;
    };
}
declare const logger: Logger;
export default logger;
//# sourceMappingURL=logger.d.ts.map