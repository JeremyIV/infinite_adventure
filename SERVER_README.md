# Infinite Adventure Storage Server

This is a simple Flask server that provides storage capabilities for the Infinite Adventure game. It allows players without API keys to enjoy the game using previously generated content.

## Setup

1. Install Python 3.7+ if you don't have it already
2. Create a virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate it (Linux/Mac)
source venv/bin/activate
# or on Windows
# venv\Scripts\activate
```

3. Install the required packages:

```bash
pip install -r requirements.txt
```

## Running the Server

Start the server with:

```bash
python storage_server.py
```

### Configuration Options

The server can be configured using environment variables:

- `PORT`: The port to run the server on (default: 5000)
- `DEBUG`: Enable or disable debug mode (default: true)

Example:

```bash
PORT=8080 DEBUG=false python storage_server.py
```

## API Endpoints

The server provides the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/continuations/<hash_id>` | GET | Retrieve a stored game continuation |
| `/api/continuations/<hash_id>` | POST | Store a new game continuation |
| `/api/stats` | GET | View statistics about the stored continuations |
| `/health` | GET | Simple health check endpoint |

## Database

The server uses SQLite for storage, creating a file called `continuations.db` in the same directory. This file contains all saved game states and their corresponding responses.

The database schema is:

```sql
CREATE TABLE continuations (
    hash_id TEXT PRIMARY KEY,
    response TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Logging

The server uses Python's built-in logging module to log information about:
- Server startup and configuration
- Database initialization
- API requests and responses
- Error conditions

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

# Configure environment
ENV PORT=5000
ENV DEBUG=false

EXPOSE 5000

CMD ["python", "storage_server.py"]
```

Build and run with:

```bash
docker build -t infinite-adventure-server .
docker run -p 5000:5000 -v $(pwd):/app infinite-adventure-server
```

The volume mount ensures that the database file is stored on your host system for persistence.