# Infinite Adventure API Reference

This document provides a reference for the backend API endpoints used by Infinite Adventure.

## Base URL

All API endpoints are relative to your Vercel deployment URL.

## Continuations API

### Get Continuation

Retrieves a continuation by its hash ID.

- **URL**: `/api/continuations/:hash`
- **Method**: `GET`
- **URL Params**: `hash=[string]` - The unique hash ID of the continuation
- **Success Response**:
  - Code: 200
  - Content: `{ "response": "Continuation text...", "image_url": "https://..." }`
- **Error Response**:
  - Code: 404
  - Content: `{ "error": "Continuation not found" }`

### Store Continuation

Stores a new continuation with the given hash ID.

- **URL**: `/api/continuations/:hash`
- **Method**: `POST`
- **URL Params**: `hash=[string]` - The unique hash ID to store the continuation under
- **Data Params**:
  ```json
  {
    "response": "Continuation text...",
    "image_url": "https://..."
  }
  ```
- **Success Response**:
  - Code: 201
  - Content: `{ "message": "Continuation stored successfully" }`
- **Error Response**:
  - Code: 400
  - Content: `{ "error": "Invalid data format" }`

## Images API

### Upload Image

Uploads an image from a URL to GridFS storage.

- **URL**: `/api/images/upload`
- **Method**: `POST`
- **Data Params**:
  ```json
  {
    "url": "https://external-image-url.com/image.png"
  }
  ```
- **Success Response**:
  - Code: 200
  - Content: `{ "url": "/api/images/file/12345...", "id": "12345..." }`
- **Error Response**:
  - Code: 400
  - Content: `{ "error": "Image URL is required" }`

### Get Image

Retrieves an image by its ID from GridFS storage.

- **URL**: `/api/images/file/:id`
- **Method**: `GET`
- **URL Params**: `id=[string]` - The unique ID of the stored image
- **Success Response**:
  - Code: 200
  - Content: Binary image data (with appropriate content-type header)
- **Error Response**:
  - Code: 404
  - Content: `{ "error": "Image not found" }`

## Statistics API

### Get Stats

Retrieves usage statistics for the storage server.

- **URL**: `/api/stats`
- **Method**: `GET`
- **Success Response**:
  - Code: 200
  - Content: 
  ```json
  {
    "total_continuations": 123,
    "total_images": 45,
    "storage_usage_mb": 67.8
  }
  ```

## Health API

### Health Check

Checks if the API server is running correctly.

- **URL**: `/health`
- **Method**: `GET`
- **Success Response**:
  - Code: 200
  - Content: `{ "status": "ok", "timestamp": "2023-03-02T12:34:56Z" }`