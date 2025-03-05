# Deployment Guide for Infinite Adventure

This document outlines how to deploy the Infinite Adventure API to Vercel and the frontend to GitHub Pages.

## Backend Deployment (Vercel)

### Prerequisites

- A Vercel account
- A MongoDB Atlas account with a database set up
- The Vercel CLI installed locally (optional, for testing locally)

### Environment Variables

You need to set up the following environment variables in your Vercel project:

- `MONGODB_URI`: Your MongoDB connection string
- `MONGODB_DB`: Your MongoDB database name (default: "infinite_adventure")
- `MONGODB_COLLECTION`: Your MongoDB collection name (default: "continuations")

### Deployment Steps

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Install the Vercel CLI:
```bash
npm i -g vercel
```

4. Login to Vercel:
```bash
vercel login
```

5. Deploy to Vercel:
```bash
vercel
```

6. For production deployment:
```bash
vercel --prod
```

7. Update the `CONFIG.API_ENDPOINTS.STORAGE_SERVER` in `frontend/js/config.js` with your Vercel deployment URL.

## Frontend Deployment (GitHub Pages)

### Prerequisites

- A GitHub account
- Git installed locally

### Deployment Steps

1. Create a GitHub repository for your project

2. Initialize Git in your project directory (if not already done):
```bash
git init
```

3. Add your GitHub repository as a remote:
```bash
git remote add origin https://github.com/your-username/your-repo-name.git
```

4. Create a branch for GitHub Pages:
```bash
git checkout -b gh-pages
```

5. Add and commit the frontend files:
```bash
git add frontend/*
git commit -m "Add frontend files for GitHub Pages"
```

6. Push to GitHub:
```bash
git push origin gh-pages
```

7. In your GitHub repository settings, go to the "Pages" section and select the gh-pages branch as the source.

8. Your site will be available at https://your-username.github.io/your-repo-name

## Connecting Frontend and Backend

After deploying both the frontend and backend, you need to update the frontend configuration to point to your Vercel backend:

1. Edit `frontend/js/config.js`
2. Update the `CONFIG.API_ENDPOINTS.STORAGE_SERVER` property with your Vercel URL
3. Commit and push the changes to the gh-pages branch