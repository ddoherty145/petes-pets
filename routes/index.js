const Pet = require('../models/pet');

module.exports = (app) => {

  /* GET home page. */
  app.get('/', async (req, res, next) => {
    try {
      const pets = await Pet.find();
      res.render('pets-index', { pets: pets });
    } catch (err) {
      next(err);
    }
  });
}