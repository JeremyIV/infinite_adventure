# Vercel Deployment for Infinite Adventure

This document outlines how to deploy the Infinite Adventure API to Vercel.

## Prerequisites

- A Vercel account
- A MongoDB Atlas account with a database set up
- The Vercel CLI installed locally (optional, for testing locally)

## Environment Variables

You need to set up the following environment variables in your Vercel project:

- `MONGODB_URI`: Your MongoDB connection string
- `MONGODB_DB`: Your MongoDB database name (default: "infinite_adventure")
- `MONGODB_COLLECTION`: Your MongoDB collection name (default: "continuations")

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with your MongoDB credentials (this is already done).

3. Run the development server:
```bash
npm run dev
```

The server will be available at http://localhost:3000

## Deployment Steps

1. Install the Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy to Vercel:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

5. Update the `CONFIG.API_ENDPOINTS.STORAGE_SERVER` in `js/config.js` with your Vercel deployment URL.

## API Endpoints

- `GET /api/continuations/:hash_id` - Get a stored continuation
- `POST /api/continuations/:hash_id` - Store a new continuation
- `GET /api/stats` - Get storage statistics
- `GET /health` - Health check endpoint