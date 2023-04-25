/*
all endpoints of our API:

  - GET /status => AppController.getStatus
  - GET /stats => AppController.getStats

  - POST /users => UsersController.postNew

  Add the new endpoints to the file routes/index.js:
  
  - GET /connect => AuthController.getConnect
  - GET /disconnect => AuthController.getDisconnect
  - GET /users/me => UserController.getMe

add a new endpoint:

  - POST /files => FilesController.postUpload

*/

const express = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
const FilesController = require('../controllers/FilesController');

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UserController.getMe);
router.post('/files', FilesController.postUpload);

module.exports = router;
