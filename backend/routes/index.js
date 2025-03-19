const express = require('express');
const helloRoutes = require('./helloRoutes');

const router = express.Router();

router.use('/hello', helloRoutes);

module.exports = router;
