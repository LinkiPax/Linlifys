const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Local Storage Configuration (for temporary uploads before Cloudinary)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'tmp/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `short-${uniqueSuffix}${ext}`);
  }
});

// 2. File Validation
const fileFilter = (req, file, cb) => {
  const validMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  const maxSize = 60 * 1024 * 1024; // 60MB
  
  if (!validMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Only MP4, MOV and AVI videos are allowed'), false);
  }
  
  if (file.size > maxSize) {
    return cb(new Error('File size exceeds 60MB limit'), false);
  }
  
  cb(null, true);
};

// 3. Multer Middleware Configurations
const uploadToLocal = multer({
  storage: localStorage,
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: fileFilter
});

// 4. Error Handling Middleware
const handleUploadErrors = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        success: false,
        message: 'File too large (max 60MB)'
      });
    }
    return res.status(400).json({ 
      success: false,
      message: err.message || 'File upload failed'
    });
  }
  next();
};

module.exports = {
  uploadToLocal,
  handleUploadErrors
};