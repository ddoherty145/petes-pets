const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure AWS SDK v3
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // 🔑 YOUR ACCESS KEY ID
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // 🔑 YOUR SECRET ACCESS KEY
  },
  region: process.env.S3_REGION || 'us-west-1'
});

// Configure multer for S3 uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET, // 🔑 YOUR BUCKET NAME
    key: function (req, file, cb) {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `pets/${uniqueSuffix}-${file.originalname}`;
      cb(null, filename);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to delete files from S3
const deleteFromS3 = async (key) => {
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET, // 🔑 YOUR BUCKET NAME
    Key: key
  });
  return s3.send(command);
};

// Helper function to get S3 URL
const getS3Url = (key) => {
  return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
};

module.exports = {
  upload,
  deleteFromS3,
  getS3Url,
  s3
};
