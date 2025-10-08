const multer = require('multer');
const { upload } = require('../config/s3');

// Middleware for uploading pet avatar
const uploadPetAvatar = upload.single('avatar');

// Error handling middleware for file uploads
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        errors: { 
          file: { message: 'File size too large. Maximum size is 5MB.' } 
        } 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        errors: { 
          file: { message: 'Too many files uploaded.' } 
        } 
      });
    }
  }
  
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({ 
      errors: { 
        file: { message: 'Only image files are allowed!' } 
      } 
    });
  }
  
  next(err);
};

// Middleware to process uploaded avatar and add URL to req.body
const processUploadedAvatar = (req, res, next) => {
  if (req.file) {
    // Add S3 URL to req.body for database storage
    req.body.avatarUrl = req.file.location;
    // Keep legacy fields for backward compatibility
    req.body.picUrl = req.file.location;
    req.body.picUrlSq = req.file.location;
  }
  next();
};

module.exports = {
  uploadPetAvatar,
  handleUploadError,
  processUploadedAvatar
};
