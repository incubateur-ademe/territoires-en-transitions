const express = require('express');
const zipUrls = require('./server/zipUrls');

module.exports = function (app) {
  app.use(express.json()); // for parsing application/json
  app.post('/zip', zipUrls);
};
