/**
 * Debug utilities for Infinite Adventure
 */

// Debug state
let debugEnabled = false;

/**
 * Toggle debug mode on/off
 * This is exposed globally so it can be called from the browser console
 * @returns {string} Debug status message
 */
export function toggleDebug() {
  debugEnabled = !debugEnabled;
  const debugConsole = document.getElementById("debug-console");
  if (debugConsole) {
    debugConsole.style.display = debugEnabled ? "block" : "none";
    console.log(`Debug console ${debugEnabled ? "enabled" : "disabled"}`);
  }
  return `Debug mode ${debugEnabled ? "enabled" : "disabled"}`;
}

/**
 * Log debug messages to console and debug output element
 * @param {string} message The message to log
 */
export function debug(message) {
  if (!debugEnabled) return; // Skip if debug is disabled
  
  console.log(message);
  const debugOutput = document.getElementById("debug-output");
  if (debugOutput) {
    const logItem = document.createElement("div");
    logItem.textContent = message;
    debugOutput.appendChild(logItem);
    debugOutput.scrollTop = debugOutput.scrollHeight;
  }
}

/**
 * Initialize debug functionality
 */
export function initializeDebug() {
  // Register toggleDebug globally
  window.toggleDebug = toggleDebug;
  
  // Make sure debug console is hidden initially
  const debugConsole = document.getElementById("debug-console");
  if (debugConsole) {
    debugConsole.style.display = "none";
  }
  
  // Log debug instructions to console
  console.log("Infinite Adventure loaded. To enable debug mode, run: toggleDebug()");
  
  debug("Debug module initialized");
}