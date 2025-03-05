/**
 * UI management for Infinite Adventure
 * Handles DOM manipulation and UI interactions
 */
import { debug } from './debug.js';
import { CONFIG } from './config.js';
import { saveApiKeys } from './apiKeys.js';
import { gameState, newState } from './gameState.js';

// UI element references
export let keyFormContainer, gameContainer, storyElement;
export let inventoryElement, objectsElement;
export let itemInput, objectInput, useButton;

/**
 * Update the game UI with new game state
 * @param {Object} data Game state data
 */
export function updateGameState(data) {
  console.log("Updating game state:", data);
  
  // Create a new story element
  const storyTextElement = document.createElement("div");
  storyTextElement.classList.add("storytext");
  
  // Add image if available
  if (data.image_url) {
    const imageElement = document.createElement("img");
    imageElement.src = data.image_url;
    imageElement.alt = "Game scene";
    imageElement.classList.add("scene-image");
    storyTextElement.appendChild(imageElement);
    storyTextElement.appendChild(document.createElement("br"));
  }
  
  // Process the story text to highlight objects
  const modifiedStoryText = data.story_text.replace(
    CONFIG.REGEX.OBJECT_PATTERN,
    (match, objectName) => {
      return `<span class="object" id="${objectName
        .toLowerCase()
        .replace(/\s/g, "-")}">${objectName}</span>`;
    }
  );
  
  // Add the text content
  const textElement = document.createElement("div");
  textElement.innerHTML = modifiedStoryText;
  storyTextElement.appendChild(textElement);
  
  // If we need to prompt for API keys, add a button
  if (data.prompt_for_keys) {
    const keyPromptElement = document.createElement("div");
    keyPromptElement.classList.add("key-prompt");
    
    const enterKeysButton = document.createElement("button");
    enterKeysButton.textContent = "Enter API Keys";
    enterKeysButton.addEventListener("click", () => {
      showApiKeyForm();
    });
    
    keyPromptElement.appendChild(enterKeysButton);
    storyTextElement.appendChild(keyPromptElement);
  }
  
  // Add the story element to the page
  storyElement.appendChild(storyTextElement);
  
  // Scroll to the bottom of the story
  storyElement.scrollTop = storyElement.scrollHeight;
  
  // Add click handlers to objects
  const objectElements = storyElement.querySelectorAll(".object");
  objectElements.forEach((objectElement) => {
    objectElement.addEventListener("click", () => {
      objectInput.value = objectElement.textContent;
    });
  });
  
  // Update the inventory display
  inventoryElement.innerHTML = "";
  data.inventory.forEach((item) => {
    const itemElement = document.createElement("span");
    itemElement.classList.add("item");
    itemElement.textContent = item;
    itemElement.addEventListener("click", () => {
      itemInput.value = item;
    });
    inventoryElement.appendChild(itemElement);
  });
  
  // Clear the input fields
  itemInput.value = "";
  objectInput.value = "";
}

/**
 * Show the API key form
 */
export function showApiKeyForm() {
  debug("Showing API key form");
  if (keyFormContainer) {
    keyFormContainer.style.display = "block";
    
    // Modify the header text to indicate entering keys to continue
    const formTitle = keyFormContainer.querySelector("h1");
    if (formTitle) {
      formTitle.textContent = "Enter API Keys to Continue";
    }
    
    // If there's game content already, don't hide it
    if (gameState.assistant_responses.length > 0) {
      debug("Keeping game container visible");
      // This allows the player to see their game while entering API keys
      if (gameContainer) gameContainer.style.display = "block";
      
      // Remove any existing API message before adding a new one
      const existingMessage = keyFormContainer.querySelector(".api-message");
      if (existingMessage) {
        existingMessage.remove();
      }
      
      // Add a message indicating they need keys to continue
      const apiMessage = document.createElement("div");
      apiMessage.classList.add("api-message");
      apiMessage.textContent = "Enter your API keys to continue your adventure with this action.";
      keyFormContainer.querySelector("form").prepend(apiMessage);
    } else {
      // For a new game, hide game container (default behavior)
      if (gameContainer) gameContainer.style.display = "none";
    }
  }
}

/**
 * Handle player action (use item on object)
 * @param {string} anthropicApiKey Anthropic API key
 * @param {string} openaiApiKey OpenAI API key
 */
export async function useItem(anthropicApiKey, openaiApiKey) {
  const item = itemInput.value;
  const object = objectInput.value;
  
  if (!item || !object) {
    alert("Please select both an item and an object.");
    return;
  }
  
  // Add the action to the story
  const actionElement = document.createElement("div");
  actionElement.classList.add("action");
  actionElement.textContent = `Use ${item} on ${object}`;
  storyElement.appendChild(actionElement);
  
  try {
    // Check if the item is in the inventory
    if (!gameState.inventory.includes(item)) {
      updateGameState({
        image_url: null,
        new_scene: false,
        story_text: `You have no ${item}.`,
        inventory: gameState.inventory,
        objects: gameState.objects
      });
      return;
    }
    
    // Check if the object is in the scene
    if (!gameState.objects.includes(object)) {
      updateGameState({
        image_url: null,
        new_scene: false,
        story_text: `There is no ${object} here.`,
        inventory: gameState.inventory,
        objects: gameState.objects
      });
      return;
    }
    
    // Show thinking indicator
    const thinkingElement = document.createElement("div");
    thinkingElement.classList.add("thinking");
    thinkingElement.textContent = "Thinking...";
    storyElement.appendChild(thinkingElement);
    
    // Process the action
    const userResponse = `use ${item} on ${object}`;
    const result = await newState(userResponse, anthropicApiKey, openaiApiKey);
    
    // Remove thinking indicator
    storyElement.removeChild(thinkingElement);
    
    // Update game state
    updateGameState(result);
  } catch (error) {
    console.error("Error processing action:", error);
    
    const errorElement = document.createElement("div");
    errorElement.classList.add("error");
    errorElement.textContent = "An error occurred. Please try again.";
    storyElement.appendChild(errorElement);
  }
}

/**
 * Handle API key form submission
 * @param {Event} event The form submission event
 * @returns {Promise<{anthropicApiKey: string, openaiApiKey: string}>} The API keys
 */
export async function handleApiKeySubmit(event) {
  debug("Form submit handler triggered");
  event.preventDefault();
  
  const anthropicKeyElement = document.getElementById("anthropic-key");
  const openaiKeyElement = document.getElementById("openai-key");
  
  if (!anthropicKeyElement || !openaiKeyElement) {
    debug("ERROR: API key input elements not found");
    alert("Error: Form elements not found. Please refresh the page.");
    throw new Error("API key input elements not found");
  }
  
  const anthKey = anthropicKeyElement.value.trim();
  const oaiKey = openaiKeyElement.value.trim();
  
  if (!anthKey || !oaiKey) {
    alert("Please enter both API keys to continue.");
    throw new Error("API keys not provided");
  }
  
  debug("API keys entered, starting game...");
  
  // Save to cookies if remember is checked
  saveApiKeys(anthKey, oaiKey);
  
  // Hide API key form and show game
  if (keyFormContainer) {
    keyFormContainer.style.display = "none";
    debug("Hidden API key form");
  } else {
    debug("WARNING: keyFormContainer not found");
  }
  
  if (gameContainer) {
    gameContainer.style.display = "block";
    debug("Showing game container");
  } else {
    debug("ERROR: gameContainer not found");
  }
  
  return { anthropicApiKey: anthKey, openaiApiKey: oaiKey };
}

/**
 * Initialize UI elements
 */
export function initializeUI() {
  // Get DOM element references
  const appContainer = document.getElementById("app-container");
  gameContainer = document.getElementById("game-container");
  storyElement = document.getElementById("story");
  const imageContainer = document.getElementById("image-container");
  inventoryElement = document.getElementById("inventory");
  objectsElement = document.getElementById("objects");
  itemInput = document.getElementById("item-input");
  objectInput = document.getElementById("object-input");
  useButton = document.getElementById("use-button");
  keyFormContainer = document.getElementById("key-form-container");
  
  // Check that we have all required elements
  const requiredElements = {
    "app-container": appContainer,
    "game-container": gameContainer,
    "story": storyElement,
    "image-container": imageContainer,
    "inventory": inventoryElement,
    "objects": objectsElement,
    "item-input": itemInput,
    "object-input": objectInput,
    "use-button": useButton,
    "key-form-container": keyFormContainer
  };
  
  // Log any missing elements
  for (const [name, element] of Object.entries(requiredElements)) {
    if (!element) debug(`ERROR: ${name} not found`);
  }
  
  // Ensure proper initial visibility
  if (gameContainer) {
    gameContainer.style.display = "none";
    debug("Game container hidden initially");
  }
  
  if (keyFormContainer) {
    keyFormContainer.style.display = "block";
    debug("API key form visible initially");
  }
  
  debug("UI initialized");
}