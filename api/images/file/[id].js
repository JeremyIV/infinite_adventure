const { connectToDatabase } = require('../../mongodb');
const allowCors = require('../../cors-handler');
const { ObjectId } = require('mongodb');

// Handler function
const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get image ID from the URL path
  const imageId = req.query.id;
  
  if (!imageId) {
    return res.status(400).json({ error: 'Image ID is required' });
  }

  try {
    // Connect to MongoDB and get GridFS bucket
    const { bucket } = await connectToDatabase();
    
    // Create ObjectId from string ID
    const id = new ObjectId(imageId);
    
    // Check if file exists in GridFS
    const file = await bucket.find({ _id: id }).next();
    
    if (!file) {
      console.log(`Image not found: ${imageId}`);
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', file.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Create download stream
    const downloadStream = bucket.openDownloadStream(id);
    
    // Pipe the file data to the response
    downloadStream.pipe(res);
    
    // Handle errors
    downloadStream.on('error', (error) => {
      console.error(`Error streaming image: ${error.message}`);
      res.status(500).json({ error: 'Failed to retrieve image' });
    });
  } catch (error) {
    console.error(`Error retrieving image: ${error.message}`);
    return res.status(500).json({ error: 'Failed to retrieve image' });
  }
};

// Wrap the handler with the CORS middleware
module.exports = allowCors(handler);