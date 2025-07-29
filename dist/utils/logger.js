import winston from 'winston';
import config from '../config/index.js';
const { combine, timestamp, errors, json, printf, colorize } = winston.format;
// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});
// Create logger instance with proper typing
const logger = winston.createLogger({
    level: config.logging.level,
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
    defaultMeta: { service: 'bitsacco-bot' },
    transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles,
        }),
        // Write all logs with importance level of `info` or less to `combined.log`
        new winston.transports.File({
            filename: `logs/${config.logging.filename}`,
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles,
        }),
    ],
});
// If we're not in production, log to the console with a simple format
if (config.server.env !== 'production') {
    logger.add(new winston.transports.Console({
        format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), consoleFormat)
    }));
}
// Create a stream object for Morgan HTTP logging
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};
export default logger;
//# sourceMappingURL=logger.js.map