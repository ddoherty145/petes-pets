// MODELS
const Pet = require('../models/pet');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const sharp = require('sharp');
require('dotenv').config();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory (no disk)
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') && ['image/jpeg', 'image/png'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG/PNG allowed'));
    }
  }
});

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Upload function for S3
const uploadToS3 = async (buffer, key) => {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg'
    }
  });
  await upload.done();
  return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
};

// PET ROUTES
module.exports = (app) => {

  // INDEX PET => index.js

  // NEW PET
  app.get('/pets/new', (req, res) => {
    res.render('pets-new');
  });

  // CREATE PET
  app.post('/pets', upload.single('avatar'), async (req, res) => {
    try {
      const pet = new Pet(req.body);
      await pet.save();

      if (req.file) {
        const timestamp = Date.now();
        const baseKey = `pets/avatar/${pet._id}-${timestamp}`;
        
        // Convert to JPEG buffer with Sharp
        const imageBuffer = await sharp(req.file.buffer)
          .jpeg({ quality: 80 }) // Optimize
          .toBuffer();

        // Standard variant (400px width, 16:10 aspect)
        const standardBuffer = await sharp(imageBuffer)
          .resize(400, 400 * 10 / 16, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
        const standardUrl = await uploadToS3(standardBuffer, `${baseKey}-standard.jpg`);

        // Square variant (300px width, 1:1 aspect)
        const squareBuffer = await sharp(imageBuffer)
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
        const squareUrl = await uploadToS3(squareBuffer, `${baseKey}-square.jpg`);

        // Update pet with image URLs
        pet.avatarUrl = baseKey; // Base for views to append suffix
        pet.picUrl = standardUrl; // Legacy compatibility
        pet.picUrlSq = squareUrl; // Legacy compatibility
        await pet.save();
      }

      res.status(201).json({ pet });
    } catch (err) {
      console.error(err);
      res.status(400).json({ errors: err.errors || { message: err.message } });
    }
  });

  // SHOW PET
  app.get('/pets/:id', async (req, res, next) => {
    try {
      const pet = await Pet.findById(req.params.id);
      res.render('pets-show', { pet: pet });
    } catch (err) {
      next(err);
    }
  });

  // EDIT PET
  app.get('/pets/:id/edit', async (req, res, next) => {
    try {
      const pet = await Pet.findById(req.params.id);
      res.render('pets-edit', { pet: pet });
    } catch (err) {
      next(err);
    }
  });

  // UPDATE PET
  app.put('/pets/:id', upload.single('avatar'), async (req, res, next) => {
    try {
      const pet = await Pet.findById(req.params.id);
      
      // Update basic fields
      Object.assign(pet, req.body);
      
      // Handle new avatar upload
      if (req.file) {
        const timestamp = Date.now();
        const baseKey = `pets/avatar/${pet._id}-${timestamp}`;
        
        // Convert to JPEG buffer with Sharp
        const imageBuffer = await sharp(req.file.buffer)
          .jpeg({ quality: 80 })
          .toBuffer();

        // Standard variant (400px width, 16:10 aspect)
        const standardBuffer = await sharp(imageBuffer)
          .resize(400, 400 * 10 / 16, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
        const standardUrl = await uploadToS3(standardBuffer, `${baseKey}-standard.jpg`);

        // Square variant (300px width, 1:1 aspect)
        const squareBuffer = await sharp(imageBuffer)
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
        const squareUrl = await uploadToS3(squareBuffer, `${baseKey}-square.jpg`);

        // Update pet with new image URLs
        pet.avatarUrl = baseKey;
        pet.picUrl = standardUrl;
        pet.picUrlSq = squareUrl;
      }
      
      await pet.save();
      res.redirect(`/pets/${pet._id}`);
    } catch (err) {
      next(err);
    }
  });

  // DELETE PET
  app.delete('/pets/:id', async (req, res, next) => {
    try {
      await Pet.findByIdAndDelete(req.params.id);
      res.redirect('/');
    } catch (err) {
      next(err);
    }
  });

  //SEARCH PET
  app.get('/search', (req, res) => {
    const term = req.query.term ? new RegExp(req.query.term, 'i') : null;
    const page = parseInt(req.query.page) || 1;
  
    const query = term ? {
      $or: [
        { name: term },
        { species: term }
      ]
    } : {};
  
    Pet.paginate(query, { page, limit: 10 }).then((results) => {
      res.render('pets-index', {
        pets: results.docs,
        pagesCount: results.pages,
        currentPage: page,
        term: req.query.term || '' // Pass term for URL construction
      });
    }).catch((err) => {
      console.error(err);
      res.status(500).send('Server Error');
    });
  });

  // Add error handling middleware for file uploads
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          errors: { 
            file: { message: 'File size too large. Maximum size is 5MB.' } 
          } 
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          errors: { 
            file: { message: 'Only JPEG and PNG images are allowed.' } 
          } 
        });
      }
    }
    
    next(err);
  });
}