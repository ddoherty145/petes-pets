// Set NODE_ENV to test to prevent server from connecting to MongoDB
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
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
});