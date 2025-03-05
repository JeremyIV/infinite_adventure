import os
import json
import sqlite3
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

#=============================================================================
# CONFIGURATION
#=============================================================================

# Database settings
DB_PATH = "continuations.db"
APP_VERSION = "1.0.0"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("storage_server")

#=============================================================================
# APPLICATION SETUP
#=============================================================================

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

#=============================================================================
# DATABASE FUNCTIONS
#=============================================================================

def get_db_connection():
    """Create and return a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

def init_db():
    """Initialize the SQLite database with the required tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create table for storing game continuations
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS continuations (
        hash_id TEXT PRIMARY KEY,
        response TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create an index for faster lookups
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_hash_id ON continuations (hash_id)')
    
    conn.commit()
    conn.close()
    
    logger.info(f"Database initialized at {DB_PATH}")

# Initialize the database on startup
init_db()

#=============================================================================
# API ENDPOINTS
#=============================================================================

@app.route('/api/continuations/<hash_id>', methods=['GET'])
def get_continuation(hash_id):
    """Get a stored continuation by its hash ID."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query the database for the specified hash_id
        cursor.execute('SELECT response, image_url FROM continuations WHERE hash_id = ?', (hash_id,))
        result = cursor.fetchone()
        
        conn.close()
        
        if result:
            logger.info(f"Retrieved continuation: {hash_id}")
            return jsonify({
                'response': result['response'],
                'image_url': result['image_url']
            }), 200
        else:
            logger.info(f"Continuation not found: {hash_id}")
            return jsonify({'error': 'Continuation not found'}), 404
            
    except Exception as e:
        logger.error(f"Error retrieving continuation: {e}")
        return jsonify({'error': 'Server error'}), 500

@app.route('/api/continuations/<hash_id>', methods=['POST'])
def store_continuation(hash_id):
    """Store a new continuation."""
    try:
        # Get the data from the request
        data = request.json
        
        if not data or 'response' not in data:
            logger.warning(f"Invalid data format for continuation: {hash_id}")
            return jsonify({'error': 'Invalid data format'}), 400
        
        # Extract values
        response = data['response']
        image_url = data.get('image_url', '')  # Optional field
        
        # Connect to the database and store the continuation
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First check if this hash already exists (avoid duplicates)
        cursor.execute('SELECT hash_id FROM continuations WHERE hash_id = ?', (hash_id,))
        if cursor.fetchone():
            conn.close()
            logger.info(f"Continuation already exists: {hash_id}")
            return jsonify({'message': 'Continuation already exists'}), 200
        
        # Insert the new continuation
        cursor.execute(
            'INSERT INTO continuations (hash_id, response, image_url) VALUES (?, ?, ?)',
            (hash_id, response, image_url)
        )
        
        conn.commit()
        conn.close()
        
        logger.info(f"Stored new continuation: {hash_id}")
        return jsonify({'message': 'Continuation stored successfully'}), 201
        
    except Exception as e:
        logger.error(f"Error storing continuation: {e}")
        return jsonify({'error': 'Server error'}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get storage statistics."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Count total continuations
        cursor.execute('SELECT COUNT(*) as count FROM continuations')
        total_count = cursor.fetchone()['count']
        
        # Count continuations with images
        cursor.execute('SELECT COUNT(*) as count FROM continuations WHERE image_url != ""')
        with_images = cursor.fetchone()['count']
        
        # Get database size
        cursor.execute('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()')
        db_size = cursor.fetchone()['size']
        
        conn.close()
        
        stats = {
            'total_continuations': total_count,
            'continuations_with_images': with_images,
            'database_size_bytes': db_size,
            'database_size_mb': round(db_size / (1024 * 1024), 2) if db_size else 0
        }
        
        logger.info(f"Stats retrieved: {stats}")
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Error retrieving stats: {e}")
        return jsonify({'error': 'Server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    logger.debug("Health check requested")
    return jsonify({
        'status': 'healthy', 
        'version': APP_VERSION
    }), 200

#=============================================================================
# APPLICATION ENTRY POINT
#=============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('DEBUG', 'true').lower() == 'true'
    
    logger.info(f"Starting server on port {port} with debug={debug_mode}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)