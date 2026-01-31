
/**
 * Quantum Error Logging & Telemetry Service
 */

type LogCallback = (msg: string) => void;
let logCallback: LogCallback | null = null;

// Mock webhook endpoint for telemetry (remote logging)
const TELEMETRY_ENDPOINT = "https://webhook.site/placeholder-for-quantum-telemetry";

export const initializeErrorService = (cb: LogCallback) => {
  logCallback = cb;
};

export const reportSystemError = async (error: Error | string, context: string = "CORE") => {
  const errorMessage = error instanceof Error ? error.message : error;
  const timestamp = new Date().toISOString();
  const logEntry = `[${context}] CRITICAL FAULT: ${errorMessage}`;

  // 1. Internal State Logging
  if (logCallback) {
    logCallback(logEntry);
  }

  // 2. Local Console Audit
  console.error(`%c ${logEntry}`, "color: #ff4444; font-weight: bold; font-family: monospace;");

  // 3. Remote Telemetry Transmission (Fire and forget)
  try {
    fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      mode: "no-cors", // Use no-cors for simple fire-and-forget to avoid preflight issues in browser environments
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp,
        level: "ERROR",
        context,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : null,
        userAgent: navigator.userAgent
      })
    }).catch(() => {/* Silent fail for telemetry to avoid recursion */});
  } catch (e) {
    // Secondary silence
  }
};

export const reportSystemEvent = (msg: string, context: string = "INFO") => {
  if (logCallback) {
    logCallback(`[${context}] ${msg}`);
  }
};
