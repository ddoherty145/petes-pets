const express = require('express');
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const sharp = require('sharp');
require('dotenv').config();

const app = express();
const port = 3003;

// Configure AWS SDK v3
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.S3_REGION || 'us-west-1'
});

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

// Upload function for S3
const uploadToS3 = async (buffer, key) => {
  const upload = new Upload({
    client: s3,
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

// In-memory storage for testing (replaces MongoDB temporarily)
let pets = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Pet creation form
app.get('/pets/new', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pet Store - Test Upload</title>
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    </head>
    <body>
      <div class="container mt-5">
        <h1>Test Pet Upload</h1>
        <p class="text-info">Testing S3 upload without MongoDB</p>
        <p class="text-success">Bucket: ${process.env.S3_BUCKET}</p>
        <form id="new-pet" action="/pets" method="POST" enctype="multipart/form-data">
          <div class="form-group">
            <label>Name*</label>
            <input class="form-control" name="name" required>
          </div>
          <div class="form-group">
            <label>Species*</label>
            <input class="form-control" name="species" required>
          </div>
          <div class="form-group">
            <label>Avatar Image* (JPEG/PNG, max 5MB)</label>
            <input class="form-control" name="avatar" type="file" accept="image/jpeg,image/png" required>
            <small class="form-text text-muted">Upload a pet photo (JPEG or PNG format, maximum 5MB)</small>
          </div>
          <div class="form-group">
            <label>Description* (min 140 chars)</label>
            <textarea class="form-control" name="description" required minlength="140"></textarea>
          </div>
          <button class="btn btn-primary" type="submit">Save Pet</button>
        </form>
        <div id="alert" class="alert mt-3" style="display:none;"></div>
      </div>
      <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
      <script>
        if (document.querySelector('#new-pet')) {
          document.querySelector('#new-pet').addEventListener('submit', (e) => {
            e.preventDefault();

            const form = document.getElementById('new-pet');
            const formData = new FormData(form);

            axios.post('/pets', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
              .then((response) => {
                const alert = document.getElementById('alert');
                alert.classList.add('alert-success');
                alert.textContent = 'Pet saved successfully! Image uploaded to S3: ' + response.data.pet.avatarUrl;
                alert.style.display = 'block';
                setTimeout(() => {
                  alert.style.display = 'none';
                  alert.classList.remove('alert-success');
                  window.location.replace('/');
                }, 2000);
              })
              .catch((error) => {
                const alert = document.getElementById('alert');
                alert.classList.add('alert-warning');
                alert.textContent = error.response?.data?.errors 
                  ? Object.values(error.response.data.errors).map(e => e.message).join(', ')
                  : 'Oops, something went wrong. Please check your information and try again.';
                alert.style.display = 'block';
                setTimeout(() => {
                  alert.style.display = 'none';
                  alert.classList.remove('alert-warning');
                }, 3000);
              });
          });
        }
      </script>
    </body>
    </html>
  `);
});

// Create pet
app.post('/pets', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const petId = Date.now();
    const timestamp = Date.now();
    const baseKey = `pets/avatar/${petId}-${timestamp}`;
    
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

    const pet = {
      id: petId,
      name: req.body.name,
      species: req.body.species,
      avatarUrl: baseKey, // Base for views to append suffix
      picUrl: standardUrl, // Legacy compatibility
      picUrlSq: squareUrl, // Legacy compatibility
      description: req.body.description,
      createdAt: new Date()
    };

    pets.push(pet);

    res.json({
      success: true,
      pet: pet
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// List pets
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pet Store</title>
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    </head>
    <body>
      <div class="container mt-5">
        <h1>Pet Store - Test Mode</h1>
        <p class="text-info">S3 uploads working without MongoDB</p>
        <p class="text-success">Bucket: ${process.env.S3_BUCKET}</p>
        <a href="/pets/new" class="btn btn-primary">Add New Pet</a>
        <div class="row mt-4">
          ${pets.map(pet => `
            <div class="col-md-4 mb-3">
              <div class="card">
                <img src="${pet.avatarUrl ? `${pet.avatarUrl}-standard.jpg` : pet.picUrl}" class="card-img-top" style="height: 200px; object-fit: cover;">
                <div class="card-body">
                  <h5 class="card-title">${pet.name}</h5>
                  <p class="card-text">${pet.species}</p>
                  <p class="card-text">${pet.description}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Pet Store Test Server running on http://localhost:${port}`);
  console.log('AWS Credentials loaded:', !!process.env.AWS_ACCESS_KEY_ID);
  console.log('S3 Bucket:', process.env.S3_BUCKET);
});
