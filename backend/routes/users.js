const express = require('express');
const { getUsers } = require('../controllers/getUsers');

const router = express.Router();

router.post('/get', getUsers);

module.exports = router;
