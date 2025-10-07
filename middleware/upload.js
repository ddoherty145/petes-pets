const multer = require('multer');
const { upload } = require('../config/s3');

// Middleware for uploading pet images
const uploadPetImages = upload.fields([
  { name: 'picUrl', maxCount: 1 },      // Rectangular image
  { name: 'picUrlSq', maxCount: 1 }     // Square image
]);

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

// Middleware to process uploaded files and add URLs to req.body
const processUploadedFiles = (req, res, next) => {
  if (req.files) {
    // Add S3 URLs to req.body for database storage
    if (req.files.picUrl && req.files.picUrl[0]) {
      req.body.picUrl = req.files.picUrl[0].location;
    }
    if (req.files.picUrlSq && req.files.picUrlSq[0]) {
      req.body.picUrlSq = req.files.picUrlSq[0].location;
    }
  }
  next();
};

module.exports = {
  uploadPetImages,
  handleUploadError,
  processUploadedFiles
};
