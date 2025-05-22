const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require('path');
require("dotenv").config();
const multer = require('multer');
const { promisify } = require('util');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);
// Configure Cloudinary with enhanced settings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Always use HTTPS
});

// Sanitize filename for Cloudinary public_id
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/\.mp4$/, '') // Remove .mp4 extension
    .substring(0, 100); // Limit length
};

// Enhanced storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Linkipax-shorts",
    resource_type: "video",
    allowed_formats: ['mp4', 'mov', 'avi'], // Explicit allowed formats
    format: async (req, file) => {
      const ext = path.extname(file.originalname).substring(1);
      return ['mp4', 'mov', 'avi'].includes(ext) ? ext : 'mp4';
    },
    public_id: (req, file) => {
      const timestamp = Date.now();
      const cleanName = sanitizeFilename(file.originalname);
      return `short_${timestamp}_${cleanName}`;
    },
    chunk_size: 6000000, // 6MB chunks for large files
    eager: [
      { width: 640, height: 360, crop: "scale" } // Create optimized version
    ],
    eager_async: true,
    invalidate: true
  }
});

// Utility function to delete uploaded files
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
      invalidate: true
    });
  } catch (err) {
    console.error("Error deleting from Cloudinary:", err);
    throw err;
  }
};
// Set up storage for profile pictures
const profilePicStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_pictures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});
const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'event_images',
      use_filename: true,
      unique_filename: false
    });
    await unlinkAsync(filePath); // Delete file after upload
    return result;
  } catch (error) {
    await unlinkAsync(filePath); // Ensure file is deleted even if upload fails
    throw error;
  }
};

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};
const uploadProfilePic = multer({ storage: profilePicStorage });
module.exports = { 
  cloudinary, 
  storage, 
  deleteFromCloudinary,
  uploadProfilePic,
  uploadImage,
  deleteImage
};