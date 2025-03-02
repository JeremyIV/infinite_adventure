/**
 * API key management for Infinite Adventure
 */
import { CONFIG } from './config.js';
import { debug } from './debug.js';
import { setCookie, getCookie, deleteCookie } from './storage.js';

/**
 * Save API keys to cookies if remember is checked
 * @param {string} anthropicKey Anthropic API key
 * @param {string} openaiKey OpenAI API key
 */
export function saveApiKeys(anthropicKey, openaiKey) {
  const rememberKeys = document.getElementById("remember-keys").checked;
  if (rememberKeys) {
    setCookie("anthropicApiKey", anthropicKey, CONFIG.COOKIE_EXPIRY_DAYS);
    setCookie("openaiApiKey", openaiKey, CONFIG.COOKIE_EXPIRY_DAYS);
    debug("API keys saved to cookies");
  } else {
    deleteCookie("anthropicApiKey");
    deleteCookie("openaiApiKey");
    debug("API key cookies deleted (remember keys unchecked)");
  }
}

/**
 * Load API keys from cookies if available
 * @returns {Object} Object with anthropicKey and openaiKey properties
 */
export function loadApiKeys() {
  const anthropicKey = getCookie("anthropicApiKey");
  const openaiKey = getCookie("openaiApiKey");
  
  const anthropicKeyInput = document.getElementById("anthropic-key");
  const openaiKeyInput = document.getElementById("openai-key");
  
  if (anthropicKey && anthropicKeyInput) {
    anthropicKeyInput.value = anthropicKey;
    debug("Anthropic API key loaded from cookie");
  }
  
  if (openaiKey && openaiKeyInput) {
    openaiKeyInput.value = openaiKey;
    debug("OpenAI API key loaded from cookie");
  }
  
  return { anthropicKey, openaiKey };
}

/**
 * Clear saved API keys
 */
export function clearSavedApiKeys() {
  deleteCookie("anthropicApiKey");
  deleteCookie("openaiApiKey");
  
  const anthropicKeyInput = document.getElementById("anthropic-key");
  const openaiKeyInput = document.getElementById("openai-key");
  
  if (anthropicKeyInput) anthropicKeyInput.value = "";
  if (openaiKeyInput) openaiKeyInput.value = "";
  
  debug("Saved API keys cleared");
  alert("Saved API keys have been cleared.");
}