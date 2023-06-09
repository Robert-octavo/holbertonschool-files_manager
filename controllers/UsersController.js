/*
contains the new endpoint:

POST /users should create a new user in DB:

  - To create a user, you must specify an email and a password
  - If the email is missing, return an error Missing email with a status code 400
  - If the password is missing, return an error Missing password with a status code 400
  - If the email already exists in DB, return an error Already exist with a status code 400
  - The password must be stored after being hashed in SHA1
  - The endpoint is returning the new user with only the email and the id
  (auto generated by MongoDB) with a status code 201
  - The new user must be saved in the collection users:
    - email: same as the value received
    - password: SHA1 value of the value received

add a new endpoint:

GET /users/me should retrieve the user base on the token used:

  - Retrieve the user based on the token:
    - If not found, return an error Unauthorized with a status code 401
    - Otherwise, return the user object (email and id only)

*/

const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');

const UsersController = {
  postNew: async (req, res) => {
    const id = uuidv4();

    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const db = await dbClient.client.collection('users').findOne({ email: req.body.email });

    if (db) { // if email already exists
      return res.status(400).json({ error: 'Already exist' });
    } // if email doesn't exist
    await dbClient.client.collection('users').insertOne({
      id,
      email: req.body.email,
      password: sha1(req.body.password),
    });
    return res.status(201).json({ email, id });
  },

  getMe: async (req, res) => {
    const { token } = req.headers;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.client.collection('users').findOne({ id: token });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json({ email: user.email, id: user.id });
  },

};

module.exports = UsersController;
