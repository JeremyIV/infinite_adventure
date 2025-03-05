// CORS handler utility following Vercel's recommended pattern
const allowCors = fn => async (req, res) => {
  // Allow requests from any origin
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  
  // Allow credentials
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Allow all HTTP methods
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  
  // Allow all headers in the request
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Origin, X-Requested-With'
  );
  
  // Set max age for preflight requests
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Process the actual request
  try {
    return await fn(req, res);
  } catch (error) {
    console.error('Error in request handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = allowCors;