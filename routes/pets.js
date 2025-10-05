// MODELS
const Pet = require('../models/pet');

// PET ROUTES
module.exports = (app) => {

  // INDEX PET => index.js

  // NEW PET
  app.get('/pets/new', (req, res) => {
    res.render('pets-new');
  });

  // CREATE PET
  app.post('/pets', async (req, res, next) => {
    try {
      const pet = new Pet(req.body);
      await pet.save();
      res.redirect(`/pets/${pet._id}`);
    } catch (err) {
      next(err);
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
  app.put('/pets/:id', async (req, res, next) => {
    try {
      const pet = await Pet.findByIdAndUpdate(req.params.id, req.body);
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
}