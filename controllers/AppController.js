/*
contains the definition of the 2 endpoints:

  - GET /status should return if Redis is alive and if the DB is alive
  too by using the 2 utils created previously: { "redis": true, "db": true } with a status code 200
  - GET /stats should return the number of users and files in DB:
  { "users": 12, "files": 1231 } with a status code 200
    - users collection must be used for counting all users
    - files collection must be used for counting all files

*/

const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const AppController = {
  getStatus: async (req, res) => {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).json(status);
  },

  getStats: async (req, res) => {
    const stats = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    res.status(200).json(stats);
  },
};

module.exports = AppController;
