/*
that contains the class DBClient.

DBClient should have:

  - the constructor that creates a client to MongoDB:
    - host: from the environment variable DB_HOST or default: localhost
    - port: from the environment variable DB_PORT or default: 27017
    - database: from the environment variable DB_DATABASE or default: files_manager
  - a function isAlive that returns true when the connection to MongoDB is a success otherwise,
  false
  - an asynchronous function nbUsers that returns the number of documents in the collection users
  - an asynchronous function nbFiles that returns the number of documents in the collection files

After the class definition, create and export an instance of DBClient called dbClient
*/

const { MongoClient } = require('mongodb');
const { DB_HOST, DB_PORT, DB_DATABASE } = process.env;

class DBClient {
  constructor() {
    this.client = new MongoClient(`mongodb://${DB_HOST || 'localhost'}:${DB_PORT || 27017}/${DB_DATABASE || 'files_manager'}`, { useUnifiedTopology: true });
  }

  async connect() {
    await this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const db = this.client.db();
    const users = db.collection('users');
    return await users.countDocuments();
  }

  async nbFiles() {
    const db = this.client.db();
    const files = db.collection('files');
    return await files.countDocuments();
  }

  async close() {
    await this.client.close();
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
