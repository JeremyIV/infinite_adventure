const { connectToDatabase } = require('../mongodb');
const allowCors = require('../cors-handler');
const sharp = require('sharp');
const https = require('https');

// Function to download image from a URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    console.log(`Starting download from: ${url}`);
    
    const req = https.get(url, (response) => {
      console.log(`Download response status: ${response.statusCode}`);
      
      if (response.statusCode !== 200) {
        const error = new Error(`Failed to download image: ${response.statusCode}`);
        console.error(error.message);
        reject(error);
        return;
      }

      const chunks = [];
      let size = 0;
      
      response.on('data', (chunk) => {
        chunks.push(chunk);
        size += chunk.length;
        console.log(`Downloaded ${size} bytes so far...`);
      });
      
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`Download complete: ${buffer.length} bytes total`);
        resolve(buffer);
      });
      
      response.on('error', (error) => {
        console.error(`Download error: ${error.message}`);
        reject(error);
      });
    });
    
    req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      reject(error);
    });
    
    // Set a timeout (30 seconds)
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Download timed out after 30 seconds'));
    });
  });
}

// Process image: resize and convert to JPEG
async function processImage(buffer) {
  console.log(`Processing image of size: ${buffer.length} bytes`);
  try {
    // Get image metadata first to log what we're working with
    const metadata = await sharp(buffer).metadata();
    console.log(`Image metadata: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);
    
    // Process the image
    const processedBuffer = await sharp(buffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    console.log(`Image processed, new size: ${processedBuffer.length} bytes`);
    return processedBuffer;
  } catch (error) {
    console.error(`Error processing image: ${error.message}`);
    throw error;
  }
}

// Save image to GridFS
async function saveToGridFS(buffer, bucket, metadata = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream('image.jpg', {
      contentType: 'image/jpeg',
      metadata
    });

    // The 'finish' event actually provides the fileId directly
    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      reject(error);
    });
    
    // In MongoDB driver v4+, the file info is available when stream finishes
    uploadStream.on('finish', function() {
      // The uploadStream itself has the fileId
      console.log('File uploaded with ID:', this.id);
      resolve({ _id: this.id });
    });
    
    uploadStream.end(buffer);
  });
}

// Handler function
const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    // Connect to MongoDB and get GridFS bucket
    const { bucket } = await connectToDatabase();

    // Download image from OpenAI
    console.log(`Downloading image from: ${url}`);
    const imageBuffer = await downloadImage(url);
    
    // Process image (resize and convert to JPEG)
    console.log('Processing image...');
    const processedBuffer = await processImage(imageBuffer);
    
    // Save to GridFS
    console.log('Saving image to GridFS...');
    const file = await saveToGridFS(processedBuffer, bucket, { 
      originalUrl: url,
      createdAt: new Date()
    });
    
    // Generate new URL for the image
    const newImageUrl = `/api/images/file/${file._id}`;
    
    console.log(`Image stored with ID: ${file._id}`);
    return res.status(200).json({ 
      url: newImageUrl,
      id: file._id.toString()
    });
  } catch (error) {
    console.error(`Error storing image: ${error.message}`);
    return res.status(500).json({ error: 'Failed to store image' });
  }
};

// Wrap the handler with the CORS middleware
module.exports = allowCors(handler);