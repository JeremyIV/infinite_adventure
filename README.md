# ∞⚔️ INFINITE ADVENTURE ⚔️∞

Create AI Generated Text Adventures.

## About

Infinite Adventure is a browser-based text adventure game that uses AI to generate interactive story content. The game uses the Anthropic Claude API for text generation and OpenAI's DALL-E for image generation, with a shared content storage system that allows players without API keys to enjoy adventures others have created.

## How to Play

### With API Keys
1. Visit the [GitHub Pages site](https://jeremyiv.github.io/infinite_adventure/)
2. Enter your API keys when prompted:
   - Anthropic API key for the story text generation
   - OpenAI API key for image generation
3. Start your adventure!
4. As you play, your generated content will be stored and shared with other players (game text and images only, not your API keys)

### Without API Keys
1. Visit the [GitHub Pages site](https://jeremyiv.github.io/infinite_adventure/)
2. The game will use pre-generated content that other players have created
3. Play along existing adventure paths that others have explored
4. If you reach a point with no pre-generated content, you'll be prompted to either:
   - Enter API keys to continue and generate new content
   - Try a different action that has pre-generated content

## Project Structure

- `index.html` - Game interface
- `infinite_adventure.css` - Game styling
- `system_prompt.txt` - Controls the game's theme and rules
- `js/` - Modular JavaScript implementation:
  - `main.js` - Main entry point
  - `config.js` - Configuration and constants
  - `debug.js` - Debugging utilities
  - `storage.js` - Storage utilities
  - `api.js` - API interactions
  - `apiKeys.js` - API key management
  - `gameState.js` - Game state management
  - `ui.js` - UI management
  - `game.js` - Game logic and initialization
- `storage_server.py` - Backend server for storing game content
- `requirements.txt` - Python dependencies for the server
- `SERVER_README.md` - Instructions for the storage server

## Features

- Dynamic text adventure generation
- AI-generated imagery for scenes
- Interactive objects and inventory system
- Branching storylines based on your choices
- Client-side caching for faster repeat experiences
- Shared content storage enabling play without API keys
- 64-bit hash-based content identification

## Customizing the Game

To customize the adventure's theme and gameplay, you can modify the system prompt in `system_prompt.txt`. The `#Story` section defines the general theme and goals of the adventure.

## Running the Storage Server

See [SERVER_README.md](SERVER_README.md) for instructions on setting up and running the storage server.

## Privacy

- When using API keys: API calls are made directly from your browser to AI providers. Your API keys remain on your device.
- Content sharing: Game text and generated images are stored in a central database to enable play without API keys.
- No personal information is collected or stored.