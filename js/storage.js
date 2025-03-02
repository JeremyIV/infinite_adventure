/**
 * Storage utilities for Infinite Adventure
 * Handles cookies, local storage, and server storage operations
 */
import { CONFIG } from './config.js';
import { debug } from './debug.js';

/**
 * Set a cookie with given name, value, and expiry days
 * @param {string} name Cookie name
 * @param {string} value Cookie value
 * @param {number} days Days until expiry
 */
export function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  debug(`Cookie set: ${name} (expires in ${days} days)`);
}

/**
 * Get a cookie by name
 * @param {string} name Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export function getCookie(name) {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(nameEQ) === 0) {
      const value = decodeURIComponent(cookie.substring(nameEQ.length));
      debug(`Cookie retrieved: ${name}`);
      return value;
    }
  }
  debug(`Cookie not found: ${name}`);
  return null;
}

/**
 * Delete a cookie by name
 * @param {string} name Cookie name
 */
export function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
  debug(`Cookie deleted: ${name}`);
}

/**
 * Get a hash string using FNV-1a 64-bit algorithm for better collision resistance
 * @param {*} data Data to hash
 * @returns {string} 64-bit hash as a hex string
 */
export function getHashString(data) {
  const str = JSON.stringify(data);
  
  // Using BigInt for 64-bit operations
  const FNV_PRIME = 1099511628211n;
  const OFFSET_BASIS = 14695981039346656037n;
  
  let hash = OFFSET_BASIS;
  
  // Process each character in the string
  for (let i = 0; i < str.length; i++) {
    // Get the character code and convert to BigInt
    const charCode = BigInt(str.charCodeAt(i));
    
    // FNV-1a hash computation
    hash = hash ^ charCode;
    hash = (hash * FNV_PRIME) % (1n << 64n); // Keep to 64 bits
  }
  
  // Convert to hex string and ensure it's the right length (16 chars for 64 bits)
  return hash.toString(16).padStart(16, '0');
}

/**
 * Check if a continuation exists in the storage server
 * @param {string} stateHash Hash of the game state to check
 * @returns {Promise<Object|null>} The continuation or null if not found
 */
export async function checkStoredContinuation(stateHash) {
  debug(`Checking for stored continuation with hash: ${stateHash}`);
  try {
    const response = await fetch(`${CONFIG.API_ENDPOINTS.STORAGE_SERVER}/continuations/${stateHash}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (response.ok) {
      debug("Found stored continuation");
      return await response.json();
    } else if (response.status === 404) {
      debug("No stored continuation found");
      return null;
    } else {
      debug(`Error checking stored continuation: ${response.status}`);
      throw new Error(`Server error: ${response.status}`);
    }
  } catch (error) {
    debug(`Error checking stored continuation: ${error.message}`);
    console.error("Error checking stored continuation:", error);
    return null; // Return null on error to allow fallback to API
  }
}

/**
 * Store a continuation in the storage server
 * @param {string} stateHash Hash of the game state to store
 * @param {Object} continuation The continuation data to store
 * @returns {Promise<boolean>} True if stored successfully
 */
export async function storeContinuation(stateHash, continuation) {
  debug(`Storing continuation with hash: ${stateHash}`);
  try {
    const response = await fetch(`${CONFIG.API_ENDPOINTS.STORAGE_SERVER}/continuations/${stateHash}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(continuation)
    });
    
    if (response.ok) {
      debug("Successfully stored continuation");
      return true;
    } else {
      debug(`Error storing continuation: ${response.status}`);
      throw new Error(`Server error: ${response.status}`);
    }
  } catch (error) {
    debug(`Error storing continuation: ${error.message}`);
    console.error("Error storing continuation:", error);
    return false;
  }
}