# ∞⚔️ INFINITE ADVENTURE ⚔️∞

Create AI Generated Text Adventures.

## About

Infinite Adventure is a browser-based text adventure game that uses AI to generate interactive story content. The game uses the Anthropic Claude API for text generation and OpenAI's DALL-E for image generation, with a shared content storage system that allows players without API keys to enjoy adventures others have created.

## Project Structure

The project is organized into the following directories:

- `frontend/` - Client-side web application
  - HTML, CSS, and JavaScript for the game interface
  - System prompt that defines the game's theme
  
- `backend/` - Server-side API for content storage
  - Vercel serverless functions for storing and retrieving game data
  - MongoDB integration with GridFS for storing images
  
- `docs/` - Project documentation
  - Deployment instructions
  - API reference

## Quick Links

- [Frontend Documentation](frontend/README.md)
- [Backend API Documentation](backend/README.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Features

- Dynamic text adventure generation
- AI-generated imagery for scenes
- Interactive objects and inventory system
- Branching storylines based on your choices
- Client-side caching for faster repeat experiences
- Shared content storage enabling play without API keys
- 64-bit hash-based content identification
- MongoDB GridFS for persistent image storage

## Privacy

- When using API keys: API calls are made directly from your browser to AI providers. Your API keys remain on your device.
- Content sharing: Game text and generated images are stored in a central database to enable play without API keys.
- No personal information is collected or stored.