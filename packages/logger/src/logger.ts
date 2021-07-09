import pino from 'pino';

export function createLogger(name: string, level = 'debug'): pino.Logger {
  return pino({ level, name, timestamp: true });
}
