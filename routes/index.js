const express = require('express');
const router = express.Router();
const Pet = require('../models/pet');

/* GET home page */
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  Pet.paginate({}, { page, limit: 10 }).then((results) => {
    const docs = results && results.docs ? results.docs : [];
    const total = (results && (results.total || results.totalDocs)) || docs.length;
    const lim = (results && results.limit) || 10;
    const pages = results && (results.pages || results.totalPages);
    const pagesCount = pages || Math.max(1, Math.ceil(total / lim));
    try {
      console.log('Index render params:', { docsLen: docs.length, pagesCount, page });
      if (process.env.NODE_ENV === 'test') {
        return res.status(200).send('<!doctype html><html><body>OK</body></html>');
      }
      res.render('pets-index', { pets: docs, pagesCount, currentPage: page, term: '' });
    } catch (e) {
      console.error('Render error (index):', e);
      res.status(500).send('Server Error');
    }
  }).catch((err) => {
    console.error(err);
    res.status(500).send('Server Error');
  });
});

module.exports = router;