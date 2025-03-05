const { connectToDatabase } = require('./mongodb');
const allowCors = require('./cors-handler');

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { collection, db } = await connectToDatabase();
    
    // Get total count of continuations
    const totalCount = await collection.countDocuments();
    
    // Count continuations with images
    const withImages = await collection.countDocuments({
      image_url: { $exists: true, $ne: '' }
    });
    
    // Get stats from MongoDB
    const stats = await db.command({ dbStats: 1 });
    
    // Convert stats to match the SQLite format
    const response = {
      total_continuations: totalCount,
      continuations_with_images: withImages,
      database_size_bytes: stats.dataSize || 0,
      database_size_mb: Math.round((stats.dataSize || 0) / (1024 * 1024) * 100) / 100
    };
    
    console.log(`Stats retrieved: ${JSON.stringify(response)}`);
    return res.status(200).json(response);
  } 
  catch (error) {
    console.error(`Error retrieving stats: ${error.message}`);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Wrap the handler with CORS middleware
module.exports = allowCors(handler);