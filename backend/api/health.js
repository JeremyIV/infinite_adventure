const allowCors = require('./cors-handler');

// App version - should match the same one used in the Flask server
const APP_VERSION = "1.0.0";

const handler = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log("Health check requested");
  return res.status(200).json({
    status: 'healthy (wenis)',
    version: APP_VERSION
  });
};

// Wrap the handler with CORS middleware
module.exports = allowCors(handler);