const express = require('express');
const { addPost } = require('../controllers/addPost');


const router = express.Router();

router.post('/add_post', addPost);


module.exports = router;
