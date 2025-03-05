/**
 * API interaction for Infinite Adventure
 * Handles API calls to Anthropic and OpenAI
 */
import { CONFIG } from './config.js';
import { debug } from './debug.js';

/**
 * Make a request to the Anthropic API for text generation
 * @param {string} systemPrompt The system prompt to use
 * @param {Array} aiResponses Previous AI responses
 * @param {Array} playerResponses Player responses
 * @param {string} anthropicApiKey The Anthropic API key
 * @returns {Promise<string>} The AI response text
 */
export async function getAIResponse(systemPrompt, aiResponses, playerResponses, anthropicApiKey) {
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

    const response = await fetch(CONFIG.API_ENDPOINTS.ANTHROPIC, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": CONFIG.API_VERSIONS.ANTHROPIC,
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: CONFIG.AI_MODELS.CLAUDE,
        max_tokens: CONFIG.GENERATION_SETTINGS.MAX_TOKENS,
        temperature: CONFIG.GENERATION_SETTINGS.TEMPERATURE,
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

/**
 * Generate an image using the OpenAI API
 * @param {string} prompt The image prompt to use
 * @param {string} openaiApiKey The OpenAI API key
 * @returns {Promise<string>} The image URL
 */
export async function generateImage(prompt, openaiApiKey) {
  debug("Calling OpenAI API for image generation...");
  try {
    const response = await fetch(CONFIG.API_ENDPOINTS.OPENAI_IMAGE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
        "OpenAI-Beta": "browser-direct-access"
      },
      body: JSON.stringify({
        model: CONFIG.AI_MODELS.DALLE,
        prompt: prompt,
        size: CONFIG.GENERATION_SETTINGS.IMAGE_SIZE,
        quality: CONFIG.GENERATION_SETTINGS.IMAGE_QUALITY,
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
    
    // Store the image in our database
    const imageUrl = data.data[0].url;
    return await storeImage(imageUrl);
  } catch (error) {
    debug(`Error generating image: ${error.message}`);
    console.error("Error generating image:", error);
    throw error;
  }
}

/**
 * Store an image from an external URL to our GridFS storage
 * @param {string} imageUrl The external image URL
 * @returns {Promise<string>} The new local image URL
 */
async function storeImage(imageUrl) {
  debug("Storing image to local database...");
  try {
    debug(`Uploading image from URL: ${imageUrl}`);
    const response = await fetch(`${CONFIG.API_ENDPOINTS.STORAGE_SERVER}/images/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: imageUrl
      }),
      mode: "cors"
    });

    if (!response.ok) {
      const errorText = await response.text();
      debug(`Image storage error (${response.status}): ${errorText}`);
      console.warn("Failed to store image locally, using original URL:", errorText);
      // Return original URL as fallback
      return imageUrl;
    }

    try {
      const data = await response.json();
      debug(`Image stored successfully with ID: ${data.id}`);
      
      if (!data.url || !data.id) {
        debug("Invalid response from image upload endpoint - missing url or id");
        return imageUrl; // Fallback to original URL
      }
      
      // Convert relative URL to absolute URL including the base storage server URL
      const storageBaseUrl = CONFIG.API_ENDPOINTS.STORAGE_SERVER.replace(/\/api$/, '');
      const fullUrl = `${storageBaseUrl}${data.url}`;
      debug(`Generated full image URL: ${fullUrl}`);
      return fullUrl;
    } catch (parseError) {
      debug(`Error parsing JSON response: ${parseError.message}`);
      return imageUrl; // Fallback to original URL
    }
  } catch (error) {
    debug(`Error storing image: ${error.message}`);
    console.error("Error storing image, using original URL:", error);
    // Return original URL as fallback
    return imageUrl;
  }
}