/*
contains the new endpoint:

POST /files should create a new file in DB and in disk:

  - Retrieve the user based on the token:
    - If not found, return an error Unauthorized with a status code 401
  - To create a file, you must specify:
    - name: as filename
    - type: either folder, file or image
    - parentId: (optional) as ID of the parent (default: 0 -> the root)
    - isPublic: (optional) as boolean to define if the file is public or not (default: false)
    - data: (only for type=file|image) as Base64 of the file content
  - If the name is missing, return an error Missing name with a status code 400
  - If the type is missing or not part of the list of accepted type, return an error Missintype
  with a status code 400
  - If the data is missing and type != folder, return an error Missing data with a status code 400
  - If the parentId is set:
    - If no file is present in DB for this parentId, return an error Parent not found with
    a status code 400
    - If the file present in DB for this parentId is not of type folder, return an error
    Parent is not a folder with a status code 400
  - The user ID should be added to the document saved in DB - as owner of a file
  - If the type is folder, add the new file document in the DB and return the new file with
  a status code 201
  - Otherwise:
    - All file will be stored locally in a folder (to create automatically if not present):
      - The relative path of this folder is given by the environment variable FOLDER_PATH
      - If this variable is not present or empty, use /tmp/files_manager as storing folder path
    - Create a local path in the storing folder with filename a UUID
    - Store the file in clear (reminder: data contains the Base64 of the file) in this local path
    - Add the new file document in the collection files with these attributes:
      - userId: ID of the owner document (owner from the authentication)
      - name: same as the value received
      - type: same as the value received
      - isPublic: same as the value received
      - parentId: same as the value received - if not present: 0
      - localPath: for a type=file|image, the absolute path to the file save in local
    - Return the new file with a status code 201

  - add the 2 new endpoints:

GET /files/:id should retrieve the file document based on the ID:

  - Retrieve the user based on the token:
    - If not found, return an error Unauthorized with a status code 401
  - If no file document is linked to the user and the ID passed as parameter, return an
  error Not found with a status code 404
  - Otherwise, return the file document

GET /files should retrieve all users file documents for a specific parentId and with pagination:

  - Retrieve the user based on the token:
    - If not found, return an error Unauthorized with a status code 401
  - Based on the query parameters parentId and page, return the list of file document
    - parentId:
      - No validation of parentId needed - if the parentId is not linked to any user
      folder, returns an empty list
      - By default, parentId is equal to 0 = the root
    - Pagination:
      - Each page should be 20 items max
      - page query parameter starts at 0 for the first page. If equals to 1,
      it means it’s the second page (form the 20th to the 40th), etc…
      - Pagination can be done directly by the aggregate of MongoDB

-- 2 new endpoints:

PUT /files/:id/publish should set isPublic to true on the file document based on the ID:

  - Retrieve the user based on the token:
    - If not found, return an error Unauthorized with a status code 401
  - If no file document is linked to the user and the ID passed as parameter, return an error Not found with a status code 404
  - Otherwise:
    - Update the value of isPublic to true
    - And return the file document with a status code 200

PUT /files/:id/unpublish should set isPublic to false on the file document based on the ID:

  - Retrieve the user based on the token:
    - If not found, return an error Unauthorized with a status code 401
  - If no file document is linked to the user and the ID passed as parameter, return an error Not found with a status code 404
  - Otherwise:
    - Update the value of isPublic to false
    - And return the file document with a status code 200

*/

const fs = require('fs');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');

const FilesController = {
  postUpload: async (req, res) => {
    const { token } = req.headers;
    const {
      name, type, isPublic, data,
    } = req.body;

    let { parentId } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    const filePublic = isPublic || false;
    // const fileParentId = parentId || 0;

    parentId = ObjectId(parentId);
    if (parentId !== 0) {
      const db = await dbClient.client.collection('files').findOne({ _id: parentId });
      if (!db) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (db.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const user = await dbClient.client.collection('users').findOne({ _id: ObjectId(token) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = {
      userId: user._id,
      name,
      type,
      isPublic: filePublic,
      parentId,
    };

    if (type === 'folder') {
      await dbClient.client.collection('files').insertOne(file);
      return res.status(201).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    const filePath = `${folderPath}/${uuidv4()}`;
    const dataFile = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, dataFile);

    file.localPath = filePath;
    await dbClient.client.collection('files').insertOne(file);
    return res.status(201).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
      localPath: file.localPath,
    });
  },

  getShow: async (req, res) => {
    const { token } = req.headers;
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.client.collection('users').findOne({ _id: ObjectId(token) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.client.collection('files').findOne({ _id: ObjectId(id) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
      localPath: file.localPath,
    });
  },

  getIndex: async (req, res) => {
    const { token } = req.headers;
    const { parentId } = req.query;
    let { page } = req.query;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.client.collection('users').findOne({ _id: ObjectId(token) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.client.collection('files').findOne({ _id: ObjectId(parentId) });
    if (!file) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!page) {
      page = 0;
    }

    const files = await dbClient.client.collection('files').aggregate([
      { $match: { parentId: ObjectId(parentId) } },
      { $skip: 20 * page },
      { $limit: 20 },
    ]).toArray();

    const filesList = files.map((item) => ({
      id: item._id,
      userId: item.userId,
      name: item.name,
      type: item.type,
      isPublic: item.isPublic,
      parentId: item.parentId,
      localPath: item.localPath,
    }));

    return res.status(200).json(filesList);
  },

  putPublish: async (req, res) => {
    const { token } = req.headers;
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.client.collection('users').findOne({ _id: ObjectId(token) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.client.collection('files').findOne({ _id: ObjectId(id) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updateFile = await dbClient.client.collection('files').updateOne(
      { _id: ObjectId(id) },
      { $set: { isPublic: true } },
    );

    if (!updateFile) {
      return res.status(500).json({ error: 'Can\'t update file' });
    }

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId,
      localPath: file.localPath,
    });
  },

  putUnpublish: async (req, res) => {
    const { token } = req.headers;
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.client.collection('users').findOne({ _id: ObjectId(token) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.client.collection('files').findOne({ _id: ObjectId(id) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updateFile = await dbClient.client.collection('files').updateOne(
      { _id: ObjectId(id) },
      { $set: { isPublic: false } },
    );

    if (!updateFile) {
      return res.status(500).json({ error: 'Can\'t update file' });
    }

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId,
      localPath: file.localPath,
    });
  },
};

module.exports = FilesController;
