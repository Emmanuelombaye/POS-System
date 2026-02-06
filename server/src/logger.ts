/**
 * Centralized Logging & Monitoring System
 * Tracks backend errors, payment failures, crashes, and performance
 * 
 * Features:
 * - Color-coded console logging by severity
 * - Performance tracking (API response times)
 * - Error tracking and aggregation
 * - Payment failure tracking
 * - System crash detection
 * - Memory and CPU monitoring
 */

import * as fs from "fs";
import * as path from "path";

export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "CRITICAL" | "PERF";
  category: string;
  message: string;
  details?: any;
  duration?: number; // milliseconds (for PERF logs)
  statusCode?: number;
}

export interface ErrorMetrics {
  total: number;
  byType: { [key: string]: number };
  recent: LogEntry[];
  lastError?: LogEntry;
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  slowRequests: LogEntry[];
  totalRequests: number;
}

const LOGS_DIR = path.join(__dirname, "../logs");
const PERFORMANCE_THRESHOLD = 500; // milliseconds
const ERROR_THRESHOLD = 10; // trigger alert after 10 errors in 1 hour

// Color codes for console output
const COLORS = {
  RESET: "\x1b[0m",
  RED: "\x1b[31m",
  YELLOW: "\x1b[33m",
  GREEN: "\x1b[32m",
  BLUE: "\x1b[34m",
  CYAN: "\x1b[36m",
  MAGENTA: "\x1b[35m",
};

let errorMetrics: ErrorMetrics = {
  total: 0,
  byType: {},
  recent: [],
};

let performanceMetrics: PerformanceMetrics = {
  avgResponseTime: 0,
  slowRequests: [],
  totalRequests: 0,
};

let requestTimes: number[] = [];

// Create logs directory if it doesn't exist
function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

// Format timestamp
function getTimestamp(): string {
  return new Date().toISOString();
}

// Color-coded console output
function colorize(text: string, color: string): string {
  return `${color}${text}${COLORS.RESET}`;
}

// Get severity color
function getSeverityColor(level: string): string {
  switch (level) {
    case "INFO":
      return COLORS.GREEN;
    case "WARN":
      return COLORS.YELLOW;
    case "ERROR":
      return COLORS.RED;
    case "CRITICAL":
      return COLORS.MAGENTA;
    case "PERF":
      return COLORS.CYAN;
    default:
      return COLORS.BLUE;
  }
}

// Write to file
function writeToFile(entry: LogEntry) {
  ensureLogsDir();

  // Separate log files by level
  const fileName = `${entry.level.toLowerCase()}-${new Date().toISOString().split("T")[0]}.log`;
  const filePath = path.join(LOGS_DIR, fileName);

  const logLine = `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}`;
  const details = entry.details ? `\n  Details: ${JSON.stringify(entry.details)}` : "";
  const duration = entry.duration ? `\n  Duration: ${entry.duration}ms` : "";

  fs.appendFileSync(filePath, logLine + details + duration + "\n");
}

// Core logging function
export function log(
  level: LogEntry["level"],
  category: string,
  message: string,
  details?: any,
  duration?: number,
  statusCode?: number
) {
  const entry: LogEntry = {
    timestamp: getTimestamp(),
    level,
    category,
    message,
    details,
    duration,
    statusCode,
  };

  // Console output
  const icon = level === "INFO" ? "ℹ️" : level === "ERROR" ? "❌" : level === "WARN" ? "⚠️" : level === "CRITICAL" ? "🚨" : level === "PERF" ? "⚡" : "📝";
  const color = getSeverityColor(level);
  const consoleMessage = `${icon} ${colorize(`[${entry.timestamp}]`, COLORS.BLUE)} ${colorize(`[${level}]`, color)} ${colorize(`[${category}]`, COLORS.CYAN)} ${message}`;

  console.log(consoleMessage);

  if (details) {
    console.log(`  └─ ${JSON.stringify(details)}`);
  }

  if (duration) {
    console.log(`  └─ ⏱️  ${duration}ms`);
  }

  // File logging
  writeToFile(entry);

  // Track metrics
  if (level === "ERROR" || level === "CRITICAL") {
    errorMetrics.total++;
    errorMetrics.byType[category] = (errorMetrics.byType[category] || 0) + 1;
    errorMetrics.recent.push(entry);
    errorMetrics.lastError = entry;

    // Keep only last 100 errors
    if (errorMetrics.recent.length > 100) {
      errorMetrics.recent = errorMetrics.recent.slice(-100);
    }

    // Alert on error spike
    if (errorMetrics.total % 10 === 0) {
      console.log(
        colorize(
          `\n🚨 ERROR ALERT: ${errorMetrics.total} errors detected in this session!\n`,
          COLORS.MAGENTA
        )
      );
    }
  }

  if (level === "PERF" && duration) {
    performanceMetrics.totalRequests++;
    requestTimes.push(duration);
    performanceMetrics.avgResponseTime =
      requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length;

    if (duration > PERFORMANCE_THRESHOLD) {
      performanceMetrics.slowRequests.push(entry);

      // Keep only last 50 slow requests
      if (performanceMetrics.slowRequests.length > 50) {
        performanceMetrics.slowRequests = performanceMetrics.slowRequests.slice(-50);
      }

      console.log(
        colorize(
          `  ⚠️  SLOW REQUEST: ${duration}ms (threshold: ${PERFORMANCE_THRESHOLD}ms)`,
          COLORS.YELLOW
        )
      );
    }
  }
}

// Convenience logging methods
export const logger = {
  info: (category: string, message: string, details?: any) =>
    log("INFO", category, message, details),

  warn: (category: string, message: string, details?: any) =>
    log("WARN", category, message, details),

  error: (category: string, message: string, details?: any) =>
    log("ERROR", category, message, details),

  critical: (category: string, message: string, details?: any) =>
    log("CRITICAL", category, message, details),

  perf: (category: string, message: string, duration: number) =>
    log("PERF", category, message, undefined, duration),

  // Track API response time
  trackRequest: (
    method: string,
    path: string,
    statusCode: number,
    duration: number
  ) => {
    const category = `API_${method}`;
    const message = `${method} ${path} - ${statusCode}`;

    if (statusCode >= 400) {
      log("ERROR", category, message, undefined, duration, statusCode);
    } else if (statusCode >= 300) {
      log("WARN", category, message, undefined, duration, statusCode);
    } else {
      log("PERF", category, message, undefined, duration, statusCode);
    }
  },

  // Track payment operations
  trackPayment: (
    status: "success" | "failure",
    amount: number,
    details?: any
  ) => {
    if (status === "success") {
      logger.info("PAYMENT", `Payment successful: ${amount}`, details);
    } else {
      logger.error("PAYMENT", `Payment failed: ${amount}`, details);
    }
  },

  // Track database operations
  trackDatabase: (
    operation: string,
    table: string,
    status: "success" | "failure",
    duration: number,
    error?: any
  ) => {
    const message = `${operation} on ${table}`;
    if (status === "success") {
      logger.perf("DATABASE", message, duration);
    } else {
      logger.error("DATABASE", message, { error, duration });
    }
  },

  // Get current metrics
  getMetrics: () => ({
    errors: errorMetrics,
    performance: performanceMetrics,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  }),

  // Get summary report
  getSummary: () => {
    const metrics = logger.getMetrics();
    return {
      timestamp: getTimestamp(),
      errors: {
        total: metrics.errors.total,
        byType: metrics.errors.byType,
        lastError: metrics.errors.lastError,
      },
      performance: {
        avgResponseTime: `${metrics.performance.avgResponseTime.toFixed(2)}ms`,
        totalRequests: metrics.performance.totalRequests,
        slowRequests: metrics.performance.slowRequests.length,
      },
      uptime: `${(metrics.uptime / 60).toFixed(2)} minutes`,
      memory: {
        heapUsed: `${(metrics.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(metrics.memory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      },
    };
  },
};

// Uncaught exception handler
process.on("uncaughtException", (error: Error) => {
  logger.critical("UNCAUGHT_EXCEPTION", error.message, {
    stack: error.stack,
  });
  console.error("Fatal Error:", error);
  // Exit after logging
  setTimeout(() => process.exit(1), 1000);
});

// Unhandled promise rejection handler
process.on("unhandledRejection", (reason: any) => {
  logger.error("UNHANDLED_REJECTION", String(reason), {
    reason,
  });
});

// Log system startup
export function initializeLogger() {
  logger.info("SYSTEM", "🚀 Eden Drop 001 System Starting...");
  logger.info("SYSTEM", `Node version: ${process.version}`);
  logger.info("SYSTEM", `Platform: ${process.platform}`);
  logger.info("SYSTEM", `Log directory: ${LOGS_DIR}`);
}

// Log system shutdown
export function shutdownLogger() {
  logger.info("SYSTEM", "🛑 System shutting down gracefully...");
  const summary = logger.getSummary();
  logger.info("SYSTEM", "Final Statistics", summary);
}

// Periodic health check logging
export function startHealthCheckLogging(intervalSeconds: number = 60) {
  setInterval(() => {
    const metrics = logger.getMetrics();
    const heapUsage = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;

    if (heapUsage > 80) {
      logger.warn("HEALTH_CHECK", `High memory usage: ${heapUsage.toFixed(2)}%`, {
        heapUsed: `${(metrics.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(metrics.memory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      });
    }

    if (metrics.errors.total > ERROR_THRESHOLD) {
      logger.warn("HEALTH_CHECK", `Error spike detected: ${metrics.errors.total} errors`, {
        byType: metrics.errors.byType,
      });
    }

    logger.info("HEALTH_CHECK", `✅ System healthy`, {
      errors: metrics.errors.total,
      avgResponseTime: `${metrics.performance.avgResponseTime.toFixed(2)}ms`,
      uptime: `${(metrics.uptime / 60).toFixed(2)}min`,
      memory: `${heapUsage.toFixed(2)}%`,
    });
  }, intervalSeconds * 1000);
}
