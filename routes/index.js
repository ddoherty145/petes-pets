const express = require('express');
const router = express.Router();
const Pet = require('../models/pet');

/* GET home page */
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  Pet.paginate({}, { page, limit: 10 }).then((results) => {
    res.render('pets-index', {
      pets: results.docs,
      pagesCount: results.pages,
      currentPage: page
    });
  }).catch((err) => {
    console.error(err);
    res.status(500).send('Server Error');
  });
});

module.exports = router;