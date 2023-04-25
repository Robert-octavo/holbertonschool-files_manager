/*
that contains new endpoints:

GET /connect should sign-in the user by generating a new authentication token:

  - By using the header Authorization and the technique of the Basic auth
  (Base64 of the <email>:<password>), find the user associate to this email
  and with this password (reminder: we are storing the SHA1 of the password)
  - If no user has been found, return an error Unauthorized with a status code 401
    Otherwise:
    - Generate a random string (using uuidv4) as token
    - Create a key: auth_<token>
    - Use this key for storing in Redis (by using the redisClient create previously)
    the user ID for 24 hours
    - Return this token: { "token": "155342df-2399-41da-9e8c-458b6ac52a0c" } with a
    status code 200

Now, we have a way to identify a user, create a token (= avoid to store the password
  on any front-end) and use this token for 24h to access to the API!

Every authenticated endpoints of our API will look at this token inside the header X-Token.

GET /disconnect should sign-out the user based on the token:

  - Retrieve the user based on the token:
    - If not found, return an error Unauthorized with a status code 401
    - Otherwise, delete the token in Redis and return nothing with a status code 204

*/

const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const AuthController = {
  getConnect: async (req, res) => {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const auth = authorization.split(' ')[1];
    const buff = Buffer.from(auth, 'base64');
    const credentials = buff.toString('utf-8').split(':');
    const email = credentials[0];
    const password = credentials[1];

    if (!email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pass = sha1(password);
    const db = await dbClient.client.collection('users').findOne({ email, password: pass });

    if (!db) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    const expiration = 24 * 3600;

    await redisClient.set(key, email, expiration);

    return res.status(200).json({ token });
  },

  getDisconnect: async (req, res) => {
    const { token } = req.headers;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const user = await redisClient.get(key);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(key);
    return res.status(204).json();
  },
};

module.exports = AuthController;
