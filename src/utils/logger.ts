import winston, { format } from 'winston';

// =================================================================================================
// Log Level Icons
const levelIcons: { [key: string]: string } = {
  error: '⛔',
  warn: '🟠',
  info: '💡',
  verbose: '💭',
  debug: '🐛',
  silly: '👉',
};

// =================================================================================================
// Log format for console
const consoleLogFormat: winston.Logform.Format = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf((info) => {
    let content = '';
    content += `${info.timestamp} │ ${levelIcons[info.level]} │ [${info.level.toUpperCase()}] ${info.message}`;
    if (info.level === 'error' && info.stack) {
      content += '\n[Stack Trace]' + '┄'.repeat(87);
      content += `\n ${info.stack}`;
    } else {
      // Don't print splat for 'error' because it has one for the error object

      // Print splat if any
      // splat is the args passed to the logger.xyz(message, ...spat) function
      const splat = info[Symbol.for('splat')];
      if (splat && splat.length) {
        if (splat.length === 1) {
          // If we only have 1 splat arg
          // Divider
          content += '\n' + '┄'.repeat(100) + '\n';
          // Stringify the only splat arg
          content += JSON.stringify(splat[0], null, 2);
        } else {
          // If we have more than 1 splat arg
          for (const sp of splat) {
            content += '\n' + '┄'.repeat(100) + '\n';
            content += JSON.stringify(sp, null, 2);
          }
        }
      }
    }

    content += '\n' + '─'.repeat(100);
    return content;
  }),
  // Format the metadata object
  format.errors({ stack: true }), // to include stack trace
  format.colorize({ all: true }),
  format.align(),
);
// =================================================================================================
// Setup logger and export
export const logger = winston.createLogger({
  level: 'silly',
  format: winston.format.json(),
  transports: [],
});

// =================================================================================================
// Setup different logger transports for different environments
// =================================================================================================
const ENV = process.env.NODE_ENV || process.env.ENV || 'development';

// Production logger transport
if (ENV === 'production' || ENV === 'prod') {
  logger.add(
    new winston.transports.Console({
      format: consoleLogFormat,
    }),
  );
}

// Development logger transport
if (ENV === 'development' || ENV === 'dev') {
  logger.add(
    new winston.transports.Console({
      format: consoleLogFormat,
    }),
  );
}

// Test logger transport
if (ENV === 'test') {
  logger.add(
    new winston.transports.Console({
      silent: true, // Silent (don't log)
    }),
  );
}

// =================================================================================================
