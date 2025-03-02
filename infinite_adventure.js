document.addEventListener("DOMContentLoaded", () => {
  // Debug configuration
  let debugEnabled = false;
  
  // Create global toggle function that can be called from browser console
  window.toggleDebug = function() {
    debugEnabled = !debugEnabled;
    const debugConsole = document.getElementById("debug-console");
    if (debugConsole) {
      debugConsole.style.display = debugEnabled ? "block" : "none";
      console.log(`Debug console ${debugEnabled ? "enabled" : "disabled"}`);
    }
    return `Debug mode ${debugEnabled ? "enabled" : "disabled"}`;
  };
  
  // Log debug instructions to console
  console.log("Infinite Adventure loaded. To enable debug mode, run: toggleDebug()");
  
  // Debug function to help with troubleshooting
  function debug(message) {
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
  
  // Make sure debug console is hidden initially
  const debugConsole = document.getElementById("debug-console");
  if (debugConsole) {
    debugConsole.style.display = "none";
  }
  
  debug("DOM content loaded");
  
  // Cookie functions for saving/loading API keys
  function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    debug(`Cookie set: ${name} (expires in ${days} days)`);
  }
  
  function getCookie(name) {
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
  
  function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
    debug(`Cookie deleted: ${name}`);
  }
  
  // Functions to save and load API keys
  function saveApiKeys(anthropicKey, openaiKey) {
    const rememberKeys = document.getElementById("remember-keys").checked;
    if (rememberKeys) {
      setCookie("anthropicApiKey", anthropicKey, 30); // Save for 30 days
      setCookie("openaiApiKey", openaiKey, 30);
      debug("API keys saved to cookies");
    } else {
      deleteCookie("anthropicApiKey");
      deleteCookie("openaiApiKey");
      debug("API key cookies deleted (remember keys unchecked)");
    }
  }
  
  function loadApiKeys() {
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
  
  // Function to clear saved API keys
  function clearSavedApiKeys() {
    deleteCookie("anthropicApiKey");
    deleteCookie("openaiApiKey");
    
    const anthropicKeyInput = document.getElementById("anthropic-key");
    const openaiKeyInput = document.getElementById("openai-key");
    
    if (anthropicKeyInput) anthropicKeyInput.value = "";
    if (openaiKeyInput) openaiKeyInput.value = "";
    
    debug("Saved API keys cleared");
    alert("Saved API keys have been cleared.");
  }
  
  // Game UI elements - we'll get these elements after DOM is loaded
  const appContainer = document.getElementById("app-container");
  let keyFormContainer = document.getElementById("key-form-container");
  let gameContainer = document.getElementById("game-container");
  let storyElement = document.getElementById("story");
  let imageContainer = document.getElementById("image-container");
  let inventoryElement = document.getElementById("inventory");
  let objectsElement = document.getElementById("objects");
  let itemInput = document.getElementById("item-input");
  let objectInput = document.getElementById("object-input");
  let useButton = document.getElementById("use-button");
  let apiKeyForm = document.getElementById("api-key-form");
  
  // API keys
  let anthropicApiKey = "";
  let openaiApiKey = "";
  
  // Storage server settings
  const STORAGE_SERVER_URL = "http://localhost:5000/api"; // Base URL for the storage server
  
  // Game state (replaces server-side state)
  let gameState = {
    inventory: [],
    objects: [],
    system_prompt: "",
    assistant_responses: [],
    user_responses: [],
    image_prompts: {}
  };

  // Object regex for extracting objects from story text
  const objectRegex = /<object>(.*?)<\/object>/g;
  
  // Load the system prompt from an external file
  async function loadSystemPrompt() {
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

  // Function to get a hash string using FNV-1a 64-bit algorithm for better collision resistance
  function getHashString(data) {
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
  
  // Function to get the hash of the current game state
  function getGameStateHash() {
    // Create a minimal version of the game state for hashing
    // Include only what's needed to uniquely identify this state
    const stateToHash = {
      assistant_responses: gameState.assistant_responses,
      user_responses: gameState.user_responses
    };
    return getHashString(stateToHash);
  }
  
  // Function to check if a continuation exists in the storage server
  async function checkStoredContinuation(stateHash) {
    debug(`Checking for stored continuation with hash: ${stateHash}`);
    try {
      const response = await fetch(`${STORAGE_SERVER_URL}/continuations/${stateHash}`, {
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
  
  // Function to store a continuation in the storage server
  async function storeContinuation(stateHash, continuation) {
    debug(`Storing continuation with hash: ${stateHash}`);
    try {
      const response = await fetch(`${STORAGE_SERVER_URL}/continuations/${stateHash}`, {
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

  // Function to make a request to the Anthropic API (replaces get_AI_response)
  async function getAIResponse(systemPrompt, aiResponses, playerResponses) {
    debug("Calling Anthropic API with CORS enabled...");
    try {
      const messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "new game"
            }
          ]
        }
      ];

      // Build conversation history
      for (let i = 0; i < aiResponses.length; i++) {
        messages.push({
          role: "assistant",
          content: [
            {
              type: "text",
              text: aiResponses[i]
            }
          ]
        });
        
        if (i < playerResponses.length) {
          messages.push({
            role: "user",
            content: [
              {
                type: "text",
                text: playerResponses[i]
              }
            ]
          });
        }
      }
      
      // Add the latest player response if it exists
      if (aiResponses.length < playerResponses.length) {
        messages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: playerResponses[playerResponses.length - 1]
            }
          ]
        });
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 1000,
          temperature: 0.7,
          system: systemPrompt,
          messages: messages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        debug(`Anthropic API error (${response.status}): ${errorText}`);
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      debug("Anthropic API call successful!");
      return data.content[0].text;
    } catch (error) {
      debug(`Error calling Anthropic API: ${error.message}`);
      console.error("Error calling Anthropic API:", error);
      throw error;
    }
  }

  // Function to generate an image using the OpenAI API (replaces generate_image)
  async function generateImage(prompt) {
    debug("Calling OpenAI API for image generation...");
    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
          // OpenAI already supports CORS by default, but we'll add this for better error tracking
          "OpenAI-Beta": "browser-direct-access"
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          size: "1024x1024",
          quality: "standard",
          n: 1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        debug(`OpenAI API error (${response.status}): ${errorText}`);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      debug("OpenAI image generated successfully!");
      return data.data[0].url; // OpenAI returns an image URL rather than binary data
    } catch (error) {
      debug(`Error generating image: ${error.message}`);
      console.error("Error generating image:", error);
      throw error;
    }
  }

  // Function to update game state
  async function newState(playerPrompt) {
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
          
          // Show a message asking the user to enter API keys or try a different action
          return {
            image_url: null,
            new_scene: false,
            story_text: "There's no pre-generated content available for this action. Please either: 1) Enter your API keys to continue this path, or 2) Try a different action.",
            inventory: gameState.inventory,
            objects: gameState.objects,
            prompt_for_keys: true
          };
        } else {
          // This is the initial state, so we must have API keys
          debug("No API keys available for initial state");
          return {
            image_url: null,
            new_scene: false,
            story_text: "To start a new adventure, you need to provide API keys.",
            inventory: [],
            objects: [],
            prompt_for_keys: true
          };
        }
      }
      
      // Generate new content using API calls
      try {
        response = await getAIResponse(
          gameState.system_prompt,
          gameState.assistant_responses,
          gameState.user_responses
        );
        
        console.log("AI Response:", response);
        
        // Parse the response
        data = JSON.parse(response);
        
        // Generate image if needed
        if (data.image_prompt) {
          imageUrl = await generateImage(data.image_prompt);
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

  // Function to start a new game
  async function startGame() {
    try {
      debug("Starting new game...");
      
      // Reset game state
      gameState.inventory = [];
      gameState.objects = [];
      gameState.assistant_responses = [];
      gameState.user_responses = [];
      gameState.image_prompts = {};
      
      // Clear the story
      if (storyElement) {
        storyElement.innerHTML = "";
        
        // Add loading message
        const loadingElement = document.createElement("div");
        loadingElement.classList.add("loading");
        loadingElement.textContent = "Starting your adventure...";
        storyElement.appendChild(loadingElement);
      }
      
      // Load the system prompt - this is now async
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
      const result = await newState(null);
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

  // Function to handle player actions (replaces the /act endpoint)
  async function useItem() {
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
      const result = await newState(userResponse);
      
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

  // Function to update the game UI (enhanced version of the original)
  function updateGameState(data) {
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
      /<object>(.*?)<\/object>/g,
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

  // Function to handle API key submission
  function handleApiKeySubmit(event) {
    debug("Form submit handler triggered");
    event.preventDefault();
    
    const anthropicKeyElement = document.getElementById("anthropic-key");
    const openaiKeyElement = document.getElementById("openai-key");
    
    if (!anthropicKeyElement || !openaiKeyElement) {
      debug("ERROR: API key input elements not found");
      alert("Error: Form elements not found. Please refresh the page.");
      return;
    }
    
    const anthKey = anthropicKeyElement.value.trim();
    const oaiKey = openaiKeyElement.value.trim();
    
    if (!anthKey || !oaiKey) {
      alert("Please enter both API keys to continue.");
      return;
    }
    
    debug("API keys entered, starting game...");
    
    // Store API keys
    anthropicApiKey = anthKey;
    openaiApiKey = oaiKey;
    
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
    
    // Start the game
    startGame();
  }

  // Function to show API key form
  function showApiKeyForm() {
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

  // Set up the API key form
  function setupApiKeyForm() {
    debug("Setting up API key form");
    
    // Make sure the form exists
    keyFormContainer = document.getElementById("key-form-container");
    apiKeyForm = document.getElementById("api-key-form");
    
    if (!keyFormContainer) {
      debug("ERROR: key-form-container not found in the DOM");
    }
    
    if (!apiKeyForm) {
      debug("ERROR: api-key-form not found in the DOM");
      return;
    }
    
    // Load saved API keys if available
    loadApiKeys();
    
    // Add event listener to form
    debug("Adding submit event listener to form");
    apiKeyForm.addEventListener("submit", handleApiKeySubmit);
    
    // Also add click handler to start button as a backup
    const startButton = document.getElementById("start-button");
    if (startButton) {
      debug("Adding click event listener to start button");
      startButton.addEventListener("click", function(e) {
        e.preventDefault();
        handleApiKeySubmit(e);
      });
    } else {
      debug("WARNING: start-button not found");
    }
    
    // Add clear keys button handler
    const clearKeysButton = document.getElementById("clear-keys");
    if (clearKeysButton) {
      debug("Adding click event listener to clear keys button");
      clearKeysButton.addEventListener("click", clearSavedApiKeys);
    } else {
      debug("WARNING: clear-keys button not found");
    }
  }

  // Initialize the application
  function init() {
    debug("Initializing application");
    
    // Make sure we have references to all DOM elements
    gameContainer = document.getElementById("game-container");
    storyElement = document.getElementById("story");
    imageContainer = document.getElementById("image-container");
    inventoryElement = document.getElementById("inventory");
    objectsElement = document.getElementById("objects");
    itemInput = document.getElementById("item-input");
    objectInput = document.getElementById("object-input");
    useButton = document.getElementById("use-button");
    
    // Log whether we found each element
    if (!gameContainer) debug("ERROR: game-container not found");
    if (!storyElement) debug("ERROR: story element not found");
    if (!imageContainer) debug("ERROR: image-container not found");
    if (!inventoryElement) debug("ERROR: inventory element not found");
    if (!objectsElement) debug("ERROR: objects element not found");
    if (!itemInput) debug("ERROR: item-input not found");
    if (!objectInput) debug("ERROR: object-input not found");
    if (!useButton) debug("ERROR: use-button not found");
    
    // Set up the API key form first - this is the entry point
    setupApiKeyForm();
    
    // Set up event listeners for the game interface
    if (useButton) {
      debug("Adding click event listener to use button");
      useButton.addEventListener("click", useItem);
    }
    
    // Add keyboard event listener for submitting actions with Enter
    document.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && gameContainer && gameContainer.style.display === "block") {
        if (itemInput && objectInput && itemInput.value && objectInput.value) {
          useItem();
        }
      }
    });
    
    // Ensure proper initial visibility
    if (gameContainer) {
      gameContainer.style.display = "none";
      debug("Game container hidden initially");
    }
    
    if (keyFormContainer) {
      keyFormContainer.style.display = "block";
      debug("API key form visible initially");
    }
  }
  
  // Start it all up
  init();
});