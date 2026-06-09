const timestamp = () => new Date().toISOString();

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    process.stdout.write(JSON.stringify({ level: "info", time: timestamp(), message, ...meta }) + "\n"),
  warn: (message: string, meta?: Record<string, unknown>) =>
    process.stderr.write(JSON.stringify({ level: "warn", time: timestamp(), message, ...meta }) + "\n"),
  error: (message: string, meta?: Record<string, unknown>) =>
    process.stderr.write(JSON.stringify({ level: "error", time: timestamp(), message, ...meta }) + "\n"),
};
