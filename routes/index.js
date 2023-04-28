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

add 2 new endpoints:

  - GET /files/:id => FilesController.getShow
  - GET /files => FilesController.getIndex

add 2 new endpoints:

  - PUT /files/:id/publish => FilesController.putPublish
  - PUT /files/:id/publish => FilesController.putUnpublish

one new endpoint:

  - GET /files/:id/data => FilesController.getFile

*/

import express from 'express';
import AppController from '../controllers/AppController';

function controllerRouting(app) {
  const router = express.Router();
  app.use('/', router);

  router.get('/status', (req, res) => {
    AppController.getStatus(req, res);
  });

  router.get('/stats', (req, res) => {
    AppController.getStats(req, res);
  });

  router.post('/users', (req, res) => {
    UsersController.postNew(req, res);
  });
}

export default controllerRouting;
