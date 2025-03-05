# Infinite Adventure Backend API

This directory contains the backend API for Infinite Adventure, implemented as serverless functions for Vercel deployment.

## API Structure

- `api/` - Serverless API endpoints
  - `continuations/[hash].js` - Store and retrieve game continuations
  - `images/file/[id].js` - Retrieve stored images
  - `images/upload.js` - Upload and process images
  - `mongodb.js` - MongoDB connection utility
  - `cors-handler.js` - CORS handling middleware
  - `health.js` - Health check endpoint
  - `stats.js` - Usage statistics endpoint

## Technologies

- Node.js
- MongoDB for data storage
- GridFS for image storage
- Vercel for serverless deployment

## Environment Variables

The following environment variables need to be set in your Vercel project:

- `MONGODB_URI` - MongoDB connection URI
- `MONGODB_DB` - MongoDB database name
- `MONGODB_COLLECTION` - MongoDB collection name for game continuations

## API Endpoints

### Continuations

- `GET /api/continuations/:hash` - Retrieve a continuation by hash ID
- `POST /api/continuations/:hash` - Store a new continuation

### Images

- `POST /api/images/upload` - Upload an image from a URL
- `GET /api/images/file/:id` - Retrieve a stored image by ID

### Statistics

- `GET /api/stats` - Get usage statistics

## Local Development

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm run dev
```

## Deployment

See [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for Vercel deployment instructions.