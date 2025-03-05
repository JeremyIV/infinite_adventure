# Infinite Adventure JavaScript Modules

This directory contains the modular JavaScript implementation for Infinite Adventure.

## Module Structure

- **main.js** - Main entry point that initializes the application
- **config.js** - Configuration values and constants
- **debug.js** - Debugging utilities
- **storage.js** - Storage utilities (cookies, hashing, server storage)
- **api.js** - API interactions (Anthropic and OpenAI)
- **apiKeys.js** - API key management
- **gameState.js** - Game state management
- **ui.js** - UI interactions and DOM manipulation
- **game.js** - Game initialization and logic

## Module Relationships

```
main.js
  ├── debug.js
  └── game.js
       ├── debug.js
       ├── apiKeys.js 
       ├── gameState.js
       ├── storage.js
       └── ui.js
            ├── debug.js
            ├── config.js
            ├── apiKeys.js
            └── gameState.js
                 ├── config.js
                 ├── debug.js
                 ├── storage.js
                 └── api.js
                      ├── config.js
                      └── debug.js
```

## Design Principles

1. **Separation of Concerns** - Each module handles a specific aspect of the application
2. **Single Responsibility** - Each function does one thing and does it well
3. **Minimal Dependencies** - Dependencies between modules are kept to a minimum
4. **Clear Interfaces** - Functions have clear inputs and outputs
5. **Consistent Naming** - Naming follows consistent patterns across modules