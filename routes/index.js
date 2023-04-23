/*
all endpoints of our API:

  - GET /status => AppController.getStatus
  - GET /stats => AppController.getStats

*/

const express = require('express');
const AppController = require('../controllers/AppController');

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

module.exports = router;
