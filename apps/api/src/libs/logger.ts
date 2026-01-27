type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors = {
  info: '\x1b[36m', // Cyan
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  debug: '\x1b[35m', // Magenta
  reset: '\x1b[0m',
};

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`${colors.info}[INFO]${colors.reset}`, message, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`${colors.warn}[WARN]${colors.reset}`, message, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`${colors.error}[ERROR]${colors.reset}`, message, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${colors.debug}[DEBUG]${colors.reset}`, message, ...args);
    }
  },
};

