/**
 * Game logic for Infinite Adventure
 * Handles game initialization and game flow
 */
import { debug } from './debug.js';
import { loadApiKeys, clearSavedApiKeys } from './apiKeys.js';
import { gameState, resetGameState, loadSystemPrompt, newState, getGameStateHash } from './gameState.js';
import { checkStoredContinuation } from './storage.js';
import { 
  initializeUI, 
  updateGameState, 
  handleApiKeySubmit, 
  showApiKeyForm, 
  useButton,
  useItem,
  storyElement,
  gameContainer,
  itemInput,
  objectInput
} from './ui.js';

// API keys
let anthropicApiKey = "";
let openaiApiKey = "";

/**
 * Start a new game
 */
export async function startGame() {
  try {
    debug("Starting new game...");
    
    // Reset game state
    resetGameState();
    
    // Clear the story
    if (storyElement) {
      storyElement.innerHTML = "";
      
      // Add loading message
      const loadingElement = document.createElement("div");
      loadingElement.classList.add("loading");
      loadingElement.textContent = "Starting your adventure...";
      storyElement.appendChild(loadingElement);
    }
    
    // Load the system prompt
    await loadSystemPrompt();
    debug("System prompt loaded");
    
    // Get the initial game state hash (empty state)
    const initialStateHash = getGameStateHash();
    
    // Check if we have a stored initial state
    let storedInitialState = null;
    try {
      storedInitialState = await checkStoredContinuation(initialStateHash);
    } catch (error) {
      debug(`Error checking for stored initial state: ${error.message}`);
      // Continue with API generation if available
    }
    
    // If we have stored initial state, we can start without API keys
    if (storedInitialState) {
      debug("Found stored initial state, using it");
    } else if (!anthropicApiKey || !openaiApiKey) {
      debug("No API keys available and no stored initial state");
      
      // Clear any loading indicators
      if (storyElement && storyElement.querySelector(".loading")) {
        storyElement.removeChild(storyElement.querySelector(".loading"));
      }
      
      // Show a message asking for API keys
      if (storyElement) {
        const errorElement = document.createElement("div");
        errorElement.classList.add("error");
        errorElement.textContent = "API keys are required to start a new adventure. Please enter your API keys.";
        storyElement.appendChild(errorElement);
      }
      
      // Show API key form
      showApiKeyForm();
      return;
    }
    
    // Get the initial game state
    const result = await newState(null, anthropicApiKey, openaiApiKey);
    debug("Initial game state received");
    
    // Remove loading message
    if (storyElement && storyElement.querySelector(".loading")) {
      storyElement.removeChild(storyElement.querySelector(".loading"));
    }
    
    // Update game state
    updateGameState(result);
  } catch (error) {
    debug(`ERROR starting game: ${error.message}`);
    console.error("Error starting game:", error);
    
    // Handle specific errors
    let errorMessage = "Failed to start the game. ";
    
    if (error.message.includes("401")) {
      errorMessage += "Invalid API key. Please check your API keys and try again.";
    } else if (error.message.includes("CORS")) {
      errorMessage += "CORS error. The API doesn't allow direct browser access. Try using a different API key.";
    } else if (error.message.includes("Network")) {
      errorMessage += "Network error. Please check your internet connection and try again.";
    } else {
      errorMessage += "Please check your API keys and try again. Error details: " + error.message;
    }
    
    if (storyElement) {
      // Clear any loading indicators first
      const loadingEl = storyElement.querySelector(".loading");
      if (loadingEl) storyElement.removeChild(loadingEl);
      
      // Add error message
      const errorElement = document.createElement("div");
      errorElement.classList.add("error");
      errorElement.textContent = errorMessage;
      storyElement.appendChild(errorElement);
    }
    
    // Show API key form again
    showApiKeyForm();
  }
}

/**
 * Set up the API key form
 */
function setupApiKeyForm() {
  debug("Setting up API key form");
  
  // Make sure the form exists
  const apiKeyForm = document.getElementById("api-key-form");
  
  if (!apiKeyForm) {
    debug("ERROR: api-key-form not found in the DOM");
    return;
  }
  
  // Load saved API keys if available
  const { anthropicKey, openaiKey } = loadApiKeys();
  anthropicApiKey = anthropicKey || "";
  openaiApiKey = openaiKey || "";
  
  // Add event listener to form
  debug("Adding submit event listener to form");
  apiKeyForm.addEventListener("submit", async (event) => {
    try {
      const keys = await handleApiKeySubmit(event);
      anthropicApiKey = keys.anthropicApiKey;
      openaiApiKey = keys.openaiApiKey;
      
      // Start the game
      startGame();
    } catch (error) {
      debug(`Error handling API key submission: ${error.message}`);
    }
  });
  
  // Also add click handler to start button as a backup
  const startButton = document.getElementById("start-button");
  if (startButton) {
    debug("Adding click event listener to start button");
    startButton.addEventListener("click", async function(e) {
      e.preventDefault();
      try {
        const keys = await handleApiKeySubmit(e);
        anthropicApiKey = keys.anthropicApiKey;
        openaiApiKey = keys.openaiApiKey;
        
        // Start the game
        startGame();
      } catch (error) {
        debug(`Error handling API key submission: ${error.message}`);
      }
    });
  } else {
    debug("WARNING: start-button not found");
  }
  
  // Add clear keys button handler
  const clearKeysButton = document.getElementById("clear-keys");
  if (clearKeysButton) {
    debug("Adding click event listener to clear keys button");
    clearKeysButton.addEventListener("click", () => {
      clearSavedApiKeys();
      anthropicApiKey = "";
      openaiApiKey = "";
    });
  } else {
    debug("WARNING: clear-keys button not found");
  }
}

/**
 * Initialize the game
 */
export function initializeGame() {
  debug("Initializing game");
  
  // Initialize UI first
  initializeUI();
  
  // Set up the API key form - this is the entry point
  setupApiKeyForm();
  
  // Set up event listeners for the game interface
  if (useButton) {
    debug("Adding click event listener to use button");
    useButton.addEventListener("click", () => useItem(anthropicApiKey, openaiApiKey));
  }
  
  // Add keyboard event listener for submitting actions with Enter
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && gameContainer && gameContainer.style.display === "block") {
      if (itemInput && objectInput && itemInput.value && objectInput.value) {
        useItem(anthropicApiKey, openaiApiKey);
      }
    }
  });
  
  debug("Game initialized");
}