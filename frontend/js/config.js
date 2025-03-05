/**
 * Configuration and constants for Infinite Adventure
 */
export const CONFIG = {
  // API settings
  API_ENDPOINTS: {
    ANTHROPIC: "https://api.anthropic.com/v1/messages",
    OPENAI_IMAGE: "https://api.openai.com/v1/images/generations",
    STORAGE_SERVER: "https://infinite-adventure-1lggflpev-jeremys-projects-37bbb7cf.vercel.app/api"
    // STORAGE_SERVER: "http://localhost:3000/api"
  },
  API_VERSIONS: {
    ANTHROPIC: "2023-06-01"
  },
  AI_MODELS: {
    CLAUDE: "claude-3-opus-20240229",
    DALLE: "dall-e-3"
  },
  GENERATION_SETTINGS: {
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7,
    IMAGE_SIZE: "1024x1024",
    IMAGE_QUALITY: "standard"
  },
  // Cookie settings
  COOKIE_EXPIRY_DAYS: 30,
  // Regular expressions
  REGEX: {
    OBJECT_PATTERN: /<object>(.*?)<\/object>/g
  }
};