const { connectToDatabase } = require('../mongodb');
const allowCors = require('../cors-handler');

// Handler function without CORS middleware
const handler = async (req, res) => {
  // Get hash from the URL path
  const hash = req.query.hash;
  
  if (!hash) {
    return res.status(400).json({ error: 'Hash ID is required' });
  }

  try {
    // Connect to MongoDB
    const { collection } = await connectToDatabase();

    if (req.method === 'GET') {
      // GET request - retrieve continuation
      const result = await collection.findOne({ hash_id: hash });
      
      if (result) {
        console.log(`Retrieved continuation: ${hash}`);
        return res.status(200).json({
          response: result.response,
          image_url: result.image_url || ''
        });
      } else {
        console.log(`Continuation not found: ${hash}`);
        return res.status(404).json({ error: 'Continuation not found' });
      }
    } 
    else if (req.method === 'POST') {
      // POST request - store continuation
      const data = req.body;
      
      if (!data || !data.response) {
        console.warn(`Invalid data format for continuation: ${hash}`);
        return res.status(400).json({ error: 'Invalid data format' });
      }
      
      // Extract values
      const response = data.response;
      const image_url = data.image_url || '';
      
      // Check if this hash already exists (avoid duplicates)
      const existing = await collection.findOne({ hash_id: hash });
      
      if (existing) {
        console.log(`Continuation already exists: ${hash}`);
        return res.status(200).json({ message: 'Continuation already exists' });
      }
      
      // Insert the new continuation
      await collection.insertOne({
        hash_id: hash,
        response: response,
        image_url: image_url,
        created_at: new Date()
      });
      
      console.log(`Stored new continuation: ${hash}`);
      return res.status(201).json({ message: 'Continuation stored successfully' });
    }
    else {
      // Method not allowed
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } 
  catch (error) {
    console.error(`Error handling request: ${error.message}`);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Wrap the handler with the CORS middleware using the Vercel pattern
module.exports = allowCors(handler);