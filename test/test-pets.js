// Set NODE_ENV to test to prevent server from connecting to MongoDB
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const path = require('path');
const should = chai.should();
const mongoose = require('mongoose');
const Pet = require('../models/pet');

// Set up test database connection
mongoose.connect('mongodb://localhost/local');

// Wait for MongoDB connection before running tests
before((done) => {
  if (mongoose.connection.readyState === 1) {
    done();
  } else {
    mongoose.connection.once('open', () => {
      done();
    });
  }
});

// Import app after MongoDB connection is set up
const app = require('../server');

const fido = {
    "name": "Norman",
    "species": "Greyhound",
    "birthday": "2008-11-11",
    "favoriteFood": "Liver",
    "picUrl": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop",
    "picUrlSq": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=250&h=250&fit=crop",
    "description": "Norman is a wonderful Greyhound who loves to play and hang out with his owners. He enjoys long walks in the park, playing fetch with his favorite toys, and taking naps in the sunshine. Norman is very friendly with children and other dogs, making him the perfect family pet. He has a gentle temperament and loves belly rubs."
}

chai.use(chaiHttp);

describe('Pets', ()  => {

  after(() => { 
    Pet.deleteMany({$or: [{name: 'Norman'}, {name: 'Spider'}] }).exec((err, pets) => {
      console.log(pets, `Deleted ${pets.n} documents`)
    }) 
  });

  // TEST INDEX
  it('should index ALL pets on / GET', (done) => {
    chai.request(app)
        .get('/')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
        });
  });

  // TEST NEW
  it('should display new form on /pets/new GET', (done) => {
    chai.request(app)
      .get(`/pets/new`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html
          done();
        });
  });
  
  // TEST CREATE 
  it('should create a SINGLE pet on /pets POST', (done) => {
    chai.request(app)
        .post('/pets')
        .send(fido)
        .end((err, res) => {
          res.should.have.status(201); // Expect JSON response after creation
          res.body.should.have.property('pet');
          res.body.pet.should.have.property('_id');
          done();
        });
  });

  // TEST SHOW
  it('should show a SINGLE pet on /pets/<id> GET', async () => {
    var pet = new Pet(fido);
    const data = await pet.save();
    const res = await chai.request(app)
      .get(`/pets/${data._id}`);
    res.should.have.status(200);
    res.should.be.html;
  });

  // TEST EDIT
  it('should edit a SINGLE pet on /pets/<id>/edit GET', async () => {
    var pet = new Pet(fido);
    const data = await pet.save();
    const res = await chai.request(app)
      .get(`/pets/${data._id}/edit`);
    res.should.have.status(200);
    res.should.be.html;
  });


  // TEST UPDATE
  it('should update a SINGLE pet on /pets/<id> PUT', async () => {
    var pet = new Pet(fido);
    const data = await pet.save();
    const res = await chai.request(app)
      .put(`/pets/${data._id}?_method=PUT`)
      .send({'name': 'Spider'})
      .redirects(0); // Don't follow redirects
    res.should.have.status(302); // Expect redirect after update
  });

  // TEST DELETE
  it('should delete a SINGLE pet on /pets/<id> DELETE', async () => {
    var pet = new Pet(fido);
    const data = await pet.save();
    const res = await chai.request(app)
      .delete(`/pets/${data._id}?_method=DELETE`)
      .redirects(0); // Don't follow redirects
    res.should.have.status(302); // Expect redirect after delete
  });

  // TEST SEARCH
  it('should search pets by name or breed on /search GET', async () => {
    const res = await chai.request(app)
      .get('/search?term=norman');
    res.should.have.status(200);
    res.should.be.html;
  });

  // Test home route pagination
  it('should return paginated pets on / GET', (done) => {
    chai.request(app)
      .get('/?page=1')
      .end((err, res) => {
        should.not.exist(err);
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });

  // Test search route pagination
  it('should return paginated search results on /search GET', (done) => {
    chai.request(app)
      .get('/search?term=poodle&page=1')
      .end((err, res) => {
        should.not.exist(err);
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });

  // Test POST /pets validation
  describe('POST /pets', () => {
    it('should create a pet with valid data', (done) => {
      const validPet = {
        name: 'Rex',
        species: 'Dog',
        birthday: '2020-01-01',
        picUrl: 'https://example.com/rex.jpg',
        picUrlSq: 'https://example.com/rex-square.jpg',
        favoriteFood: 'Chicken',
        description: 'A friendly dog with a wagging tail and a love for adventure.'.padEnd(140, ' ')
      };
      chai.request(app)
        .post('/pets')
        .send(validPet)
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(201);
          res.body.should.have.property('pet');
          res.body.pet.should.have.property('_id');
          done();
        });
    });

    it('should reject invalid pet data', (done) => {
      const invalidPet = {
        name: '',
        species: 'Dog',
        description: 'Short'
      };
      chai.request(app)
        .post('/pets')
        .send(invalidPet)
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(400);
          res.body.should.have.property('errors');
          res.body.errors.should.have.property('name').with.property('message', 'Name is required');
          res.body.errors.should.have.property('description').with.property('message', 'Description must be at least 140 characters');
          done();
        });
    });
  });

  // Test POST /pets with file uploads
  describe('POST /pets with file uploads', () => {
    // Create a test image buffer (1x1 pixel JPEG)
    const createTestImageBuffer = () => {
      // Minimal JPEG header + 1x1 pixel data
      const jpegHeader = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
        0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
        0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x00, 0xFF, 0xD9
      ]);
      return jpegHeader;
    };

    it('should create a pet with valid image file', (done) => {
      const validPet = {
        name: 'Rex',
        species: 'Dog',
        birthday: '2020-01-01',
        favoriteFood: 'Chicken',
        description: 'A friendly dog with a wagging tail and a love for adventure.'.padEnd(140, ' ')
      };
      
      const testImageBuffer = createTestImageBuffer();
      
      chai.request(app)
        .post('/pets')
        .field('name', validPet.name)
        .field('species', validPet.species)
        .field('birthday', validPet.birthday)
        .field('favoriteFood', validPet.favoriteFood)
        .field('description', validPet.description)
        .attach('avatar', testImageBuffer, 'test.jpg')
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(201);
          res.body.should.have.property('pet');
          res.body.pet.should.have.property('_id');
          res.body.pet.should.have.property('avatarUrl');
          res.body.pet.should.have.property('picUrl');
          res.body.pet.should.have.property('picUrlSq');
          // Check that avatarUrl is a base path (not full URL)
          res.body.pet.avatarUrl.should.match(/^pets\/avatar\/\d+-\d+$/);
          done();
        });
    });

    it('should reject invalid file type', (done) => {
      const validPet = {
        name: 'Rex',
        species: 'Dog',
        birthday: '2020-01-01',
        favoriteFood: 'Chicken',
        description: 'A friendly dog with a wagging tail and a love for adventure.'.padEnd(140, ' ')
      };
      
      const invalidFileBuffer = Buffer.from('This is not an image file');
      
      chai.request(app)
        .post('/pets')
        .field('name', validPet.name)
        .field('species', validPet.species)
        .field('birthday', validPet.birthday)
        .field('favoriteFood', validPet.favoriteFood)
        .field('description', validPet.description)
        .attach('avatar', invalidFileBuffer, 'test.txt')
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property('errors');
          done();
        });
    });

    it('should reject file that is too large', (done) => {
      const validPet = {
        name: 'Rex',
        species: 'Dog',
        birthday: '2020-01-01',
        favoriteFood: 'Chicken',
        description: 'A friendly dog with a wagging tail and a love for adventure.'.padEnd(140, ' ')
      };
      
      // Create a buffer larger than 5MB
      const largeFileBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      
      chai.request(app)
        .post('/pets')
        .field('name', validPet.name)
        .field('species', validPet.species)
        .field('birthday', validPet.birthday)
        .field('favoriteFood', validPet.favoriteFood)
        .field('description', validPet.description)
        .attach('avatar', largeFileBuffer, 'large.jpg')
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property('errors');
          res.body.errors.should.have.property('file');
          res.body.errors.file.should.have.property('message', 'File size too large. Maximum size is 5MB.');
          done();
        });
    });

    it('should create pet without file (legacy behavior)', (done) => {
      const validPet = {
        name: 'Rex',
        species: 'Dog',
        birthday: '2020-01-01',
        favoriteFood: 'Chicken',
        description: 'A friendly dog with a wagging tail and a love for adventure.'.padEnd(140, ' ')
      };
      
      chai.request(app)
        .post('/pets')
        .field('name', validPet.name)
        .field('species', validPet.species)
        .field('birthday', validPet.birthday)
        .field('favoriteFood', validPet.favoriteFood)
        .field('description', validPet.description)
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(201);
          res.body.should.have.property('pet');
          res.body.pet.should.have.property('_id');
          // Should not have avatarUrl when no file is uploaded
          res.body.pet.should.not.have.property('avatarUrl');
          done();
        });
    });

    it('should handle PNG files correctly', (done) => {
      const validPet = {
        name: 'Rex',
        species: 'Dog',
        birthday: '2020-01-01',
        favoriteFood: 'Chicken',
        description: 'A friendly dog with a wagging tail and a love for adventure.'.padEnd(140, ' ')
      };
      
      // Create a minimal PNG buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // color type, etc.
        0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00,
        0x02, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
      ]);
      
      chai.request(app)
        .post('/pets')
        .field('name', validPet.name)
        .field('species', validPet.species)
        .field('birthday', validPet.birthday)
        .field('favoriteFood', validPet.favoriteFood)
        .field('description', validPet.description)
        .attach('avatar', pngBuffer, 'test.png')
        .end((err, res) => {
          should.not.exist(err);
          res.should.have.status(201);
          res.body.should.have.property('pet');
          res.body.pet.should.have.property('avatarUrl');
          res.body.pet.avatarUrl.should.match(/^pets\/avatar\/\d+-\d+$/);
          done();
        });
    });
  });
});