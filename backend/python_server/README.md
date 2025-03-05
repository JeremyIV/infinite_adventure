# Python Storage Server (Legacy)

This directory contains the legacy Python Flask server that was previously used for storing continuations before migrating to the Vercel/MongoDB implementation.

## Files

- `storage_server.py` - Flask application for storing and retrieving continuations
- `requirements.txt` - Python dependencies for the server
- `continuations.db` - SQLite database for storing continuations (if present)

## Usage

This server is maintained for reference and as a fallback, but is no longer the primary storage solution for Infinite Adventure. The current implementation uses Vercel serverless functions with MongoDB.

If you need to run this server:

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python storage_server.py
```

The server will be available at http://localhost:5000

## API Endpoints

- `GET /api/continuations/:hash_id` - Get a stored continuation
- `POST /api/continuations/:hash_id` - Store a new continuation
- `GET /api/stats` - Get storage statistics