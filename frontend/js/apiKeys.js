/**
 * API key management for Infinite Adventure
 */
import { CONFIG } from './config.js';
import { debug } from './debug.js';

/**
 * Save API keys to localStorage if remember is checked
 * @param {string} anthropicKey Anthropic API key
 * @param {string} openaiKey OpenAI API key
 */
export function saveApiKeys(anthropicKey, openaiKey) {
  const rememberKeys = document.getElementById("remember-keys").checked;
  if (rememberKeys) {
    localStorage.setItem("anthropicApiKey", anthropicKey);
    localStorage.setItem("openaiApiKey", openaiKey);
    debug("API keys saved to localStorage");
  } else {
    localStorage.removeItem("anthropicApiKey");
    localStorage.removeItem("openaiApiKey");
    debug("API keys removed from localStorage (remember keys unchecked)");
  }
}

/**
 * Load API keys from localStorage if available
 * @returns {Object} Object with anthropicKey and openaiKey properties
 */
export function loadApiKeys() {
  const anthropicKey = localStorage.getItem("anthropicApiKey");
  const openaiKey = localStorage.getItem("openaiApiKey");
  
  const anthropicKeyInput = document.getElementById("anthropic-key");
  const openaiKeyInput = document.getElementById("openai-key");
  
  if (anthropicKey && anthropicKeyInput) {
    anthropicKeyInput.value = anthropicKey;
    debug("Anthropic API key loaded from localStorage");
  }
  
  if (openaiKey && openaiKeyInput) {
    openaiKeyInput.value = openaiKey;
    debug("OpenAI API key loaded from localStorage");
  }
  
  return { anthropicKey, openaiKey };
}

/**
 * Clear saved API keys
 */
export function clearSavedApiKeys() {
  localStorage.removeItem("anthropicApiKey");
  localStorage.removeItem("openaiApiKey");
  
  const anthropicKeyInput = document.getElementById("anthropic-key");
  const openaiKeyInput = document.getElementById("openai-key");
  
  if (anthropicKeyInput) anthropicKeyInput.value = "";
  if (openaiKeyInput) openaiKeyInput.value = "";
  
  debug("Saved API keys cleared");
  alert("Saved API keys have been cleared.");
}