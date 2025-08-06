import { writeFileSync, appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const LOG_PATH = path.join(__dirname, 'logs', 'moodybot_log.txt');

export function appendToTextLog(entry: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${entry}\n\n`;

  fs.appendFile(LOG_PATH, logLine, (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });
}

// Create logs directory if it doesn't exist
const logsDir = join(__dirname, "logs");
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

interface LogEntry {
  timestamp: string;
  type: "chat" | "journal" | "quote" | "analysis";
  mode?: string;
  input: string;
  output: string;
  userId?: number;
  sessionId?: number;
  error?: string;
}

export function logApiInteraction(entry: LogEntry) {
  const timestamp = new Date().toISOString();
  const logData = {
    ...entry,
    timestamp
  };

  // Log to general API log
  const generalLogPath = join(logsDir, "api_interactions.log");
  const logLine = `${timestamp} | ${entry.type.toUpperCase()} | ${entry.mode || 'N/A'} | User:${entry.userId || 'N/A'} | Session:${entry.sessionId || 'N/A'}\n`;
  const inputLine = `INPUT: ${entry.input}\n`;
  const outputLine = `OUTPUT: ${entry.output}\n`;
  const errorLine = entry.error ? `ERROR: ${entry.error}\n` : '';
  const separator = "=" + "=".repeat(80) + "\n";
  
  appendFileSync(generalLogPath, logLine + inputLine + outputLine + errorLine + separator);

  // Log to specific type file
  const typeLogPath = join(logsDir, `${entry.type}_log.txt`);
  const detailedLog = JSON.stringify(logData, null, 2) + "\n" + "=".repeat(50) + "\n";
  appendFileSync(typeLogPath, detailedLog);

  // Log to daily file
  const dateStr = new Date().toISOString().split('T')[0];
  const dailyLogPath = join(logsDir, `${dateStr}.log`);
  appendFileSync(dailyLogPath, logLine + inputLine + outputLine + errorLine + separator);

  console.log(`Logged ${entry.type} interaction to files`);
}

export function logError(error: any, context: string) {
  const timestamp = new Date().toISOString();
  const errorLogPath = join(logsDir, "errors.log");
  const errorLine = `${timestamp} | ERROR | ${context} | ${error.message || error}\n`;
  appendFileSync(errorLogPath, errorLine);
  console.error(`Error logged: ${context}`, error);
}