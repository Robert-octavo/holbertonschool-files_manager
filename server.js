/*
create the Express server:

  - it should listen on the port set by the environment variable
  PORT or by default 5000
  - it should load all routes from the file routes/index.js

*/

const express = require('express');
const routes = require('./routes');

const { PORT } = process.env;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(routes); // load all routes from the file routes/index.js

app.listen(PORT || 5000, () => {
  console.log(`Server listening on port ${PORT || 5000}`);
});
