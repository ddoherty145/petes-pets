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

const fido =     {
    "name": "Norman",
    "species": "Greyhound",
    "birthday": "2008-11-11",
    "favoriteFood": "Liver",
    "picUrl": "http://www.gpamass.com/s/img/emotionheader713297504.jpg",
    "picUrlSq": "https://www.collinsdictionary.com/images/thumb/greyhound_21701074_250.jpg",
    "description": "Fido is a dog and he's a good dog who loves to play and hang out with his owners. He also likes to nap and enjoys eating dog food"
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
        .redirects(0) // Don't follow redirects
        .end((err, res) => {
          res.should.have.status(302); // Expect redirect after creation
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
});