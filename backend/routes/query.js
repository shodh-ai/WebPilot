const express = require('express');
const { addQuery } = require('../controllers/addQuery');

const router = express.Router();

router.post('/add_query', addQuery);

module.exports = router;
