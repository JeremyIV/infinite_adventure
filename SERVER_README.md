# Infinite Adventure Storage Server

This is a simple Flask server that provides storage capabilities for the Infinite Adventure game. It allows players without API keys to enjoy the game using previously generated content.

## Setup

1. Install Python 3.7+ if you don't have it already
2. Install the required packages:

```bash
pip install -r requirements.txt
```

## Running the Server

Start the server with:

```bash
python storage_server.py
```

By default, the server runs on port 5000. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 python storage_server.py
```

## API Endpoints

The server provides the following endpoints:

- `GET /api/continuations/<hash_id>` - Retrieve a stored game continuation
- `POST /api/continuations/<hash_id>` - Store a new game continuation
- `GET /api/stats` - View statistics about the stored continuations
- `GET /health` - Simple health check endpoint

## Database

The server uses SQLite for storage, creating a file called `continuations.db` in the same directory. This file contains all saved game states and their corresponding responses.

## Deployment Considerations

For production use, consider the following:

1. **Security**: Add authentication if exposing the API publicly
2. **Scaling**: For high traffic, consider migrating to a more robust database like PostgreSQL
3. **Data Backup**: Implement a regular backup mechanism for the SQLite database file
4. **HTTPS**: Use HTTPS in production environments
5. **WSGI Server**: For production, use a WSGI server like Gunicorn instead of Flask's built-in server

## Running With Docker

If you prefer to use Docker, you can use the following Dockerfile:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY storage_server.py .

EXPOSE 5000

CMD ["python", "storage_server.py"]
```

Build and run with:

```bash
docker build -t infinite-adventure-server .
docker run -p 5000:5000 -v $(pwd):/app infinite-adventure-server
```

The volume mount ensures that the database file is stored on your host system for persistence.