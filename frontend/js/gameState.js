/**
 * Game state management for Infinite Adventure
 * Handles game state operations and logic
 */
import { CONFIG } from './config.js';
import { debug } from './debug.js';
import { getHashString, checkStoredContinuation, storeContinuation } from './storage.js';
import { getAIResponse, generateImage } from './api.js';

// Game state (server-side state replacement)
export const gameState = {
  inventory: [],
  objects: [],
  system_prompt: "",
  assistant_responses: [],
  user_responses: [],
  image_prompts: {},
  currentBlockedAction: null  // Stores the current action that was blocked due to missing API keys
};

/**
 * Load the system prompt from an external file
 */
export async function loadSystemPrompt() {
  debug("Loading system prompt from external file...");
  try {
    const response = await fetch('system_prompt.txt');
    if (!response.ok) {
      throw new Error(`Failed to load system prompt: ${response.status} ${response.statusText}`);
    }
    gameState.system_prompt = await response.text();
    debug("System prompt loaded successfully");
  } catch (error) {
    debug(`ERROR loading system prompt: ${error.message}`);
    console.error("Error loading system prompt:", error);
    throw new Error("Could not load game configuration. Please refresh the page and try again.");
  }
}

/**
 * Get the hash of the current game state
 * @returns {string} Hash of the current game state
 */
export function getGameStateHash() {
  // Create a minimal version of the game state for hashing
  // Include only what's needed to uniquely identify this state
  const stateToHash = {
    assistant_responses: gameState.assistant_responses,
    user_responses: gameState.user_responses
  };
  return getHashString(stateToHash);
}

/**
 * Reset the game state
 */
export function resetGameState() {
  gameState.inventory = [];
  gameState.objects = [];
  gameState.assistant_responses = [];
  gameState.user_responses = [];
  gameState.image_prompts = {};
  gameState.currentBlockedAction = null;
  debug("Game state reset");
}

/**
 * Update game state with new player prompt
 * @param {string|null} playerPrompt The player's prompt, or null for initial state
 * @param {string} anthropicApiKey Anthropic API key
 * @param {string} openaiApiKey OpenAI API key  
 * @returns {Promise<Object>} Object with updated game state information
 */
export async function newState(playerPrompt, anthropicApiKey, openaiApiKey) {
  debug(`Updating game state with prompt: ${playerPrompt || 'Initial State'}`);
  console.log("Player prompt:", playerPrompt);
  
  if (playerPrompt !== null) {
    gameState.user_responses.push(playerPrompt);
  }
  
  // Get the current state hash before making any changes
  const stateHash = getGameStateHash();
  debug(`Current game state hash: ${stateHash}`);
  
  // First check if this continuation already exists in storage
  let storedContinuation = null;
  try {
    storedContinuation = await checkStoredContinuation(stateHash);
  } catch (error) {
    debug(`Error checking stored continuation: ${error.message}`);
    // Continue with API generation as fallback
  }
  
  let data;
  let imageUrl = null;
  let response;
  
  // If we found a stored continuation, use it
  if (storedContinuation) {
    debug("Using stored continuation");
    response = storedContinuation.response;
    data = JSON.parse(response);
    
    // If there's a stored image URL, use it
    if (storedContinuation.image_url) {
      imageUrl = storedContinuation.image_url;
      debug("Using stored image URL");
    }
  } else {
    debug("No stored continuation found, generating new content");
    
    // Check if API keys are available
    if (!anthropicApiKey || !openaiApiKey) {
      debug("No API keys available and no stored continuation found");
      
      // If the player has already taken actions, we can revert to the previous state
      if (gameState.user_responses.length > 1) {
        // Remove the last user response
        gameState.user_responses.pop();
        
        // Store the attempted action for the UI
        const attemptedAction = playerPrompt;
        
        // Show a message asking the user to enter API keys or try a different action
        return {
          image_url: null,
          new_scene: false,
          story_text: "This path hasn't been explored before and requires API keys to continue. Please either: 1) Enter your API keys to continue this path, or 2) Try a different action that may have pre-generated content.",
          inventory: gameState.inventory,
          objects: gameState.objects,
          prompt_for_keys: true,
          action_blocked: true,
          attempted_action: attemptedAction
        };
      } else {
        // This is the initial state, so we need either API keys or stored initial state
        debug("No API keys available for initial state");
        return {
          image_url: null,
          new_scene: false,
          story_text: "To start a new adventure, you need to provide API keys or select a pre-generated path.",
          inventory: [],
          objects: [],
          prompt_for_keys: true,
          action_blocked: true
        };
      }
    }
    
    // Generate new content using API calls
    try {
      response = await getAIResponse(
        gameState.system_prompt,
        gameState.assistant_responses,
        gameState.user_responses,
        anthropicApiKey
      );
      
      console.log("AI Response:", response);
      
      // Parse the response
      data = JSON.parse(response);
      
      // Generate image if needed
      if (data.image_prompt) {
        imageUrl = await generateImage(data.image_prompt, openaiApiKey);
        debug("Generated new image");
      }
      
      // Store the continuation for future use
      await storeContinuation(stateHash, {
        response: response,
        image_url: imageUrl
      });
      
    } catch (error) {
      debug(`Error generating content: ${error.message}`);
      
      // If there was an error, remove the last user response
      if (playerPrompt !== null) {
        gameState.user_responses.pop();
      }
      
      throw error;
    }
  }
  
  // Process the result
  if (data.no_progress) {
    // If no progress, remove the last user response
    gameState.user_responses.pop();
  } else {
    // Store the AI response
    gameState.assistant_responses.push(response);
    
    // Update current objects
    if (data.new_scene) {
      gameState.objects = [];
    }
    
    // Extract objects from story text
    const newObjects = [];
    let match;
    const objectRegex = CONFIG.REGEX.OBJECT_PATTERN;
    objectRegex.lastIndex = 0; // Reset regex index
    while ((match = objectRegex.exec(data.story_text)) !== null) {
      newObjects.push(match[1]);
    }
    
    // Update objects list
    const objectsSet = new Set([...gameState.objects, ...newObjects]);
    (data.remove_objects || []).forEach(obj => objectsSet.delete(obj));
    gameState.objects = Array.from(objectsSet).sort();
    
    // Update inventory
    gameState.inventory = data.inventory || [];
    
    // Store image URL in cache if we generated a new one
    if (data.image_prompt && imageUrl) {
      const hash = getHashString(data.image_prompt);
      gameState.image_prompts[hash] = imageUrl;
    }
  }
  
  return {
    image_url: imageUrl,
    new_scene: data.new_scene,
    story_text: data.story_text,
    inventory: gameState.inventory,
    objects: gameState.objects
  };
}