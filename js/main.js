/**
 * Main entry point for Infinite Adventure
 */
import { initializeDebug, debug } from './debug.js';
import { initializeGame } from './game.js';

// When the DOM content is loaded, initialize the game
document.addEventListener("DOMContentLoaded", () => {
  // Initialize debug functionality
  initializeDebug();
  debug("DOM content loaded");
  
  // Initialize the game
  initializeGame();
});