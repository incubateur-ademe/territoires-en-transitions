const express = require('express');
const {createProxyMiddleware} = require('http-proxy-middleware');
const zipUrls = require('./server/zipUrls');

module.exports = function (app) {
  if (process.env.REACT_APP_WITH_PROXY === 'TRUE') {
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:8080',
        changeOrigin: true,
      })
    );
  }

  app.use(express.json()); // for parsing application/json
  app.post('/zip', zipUrls);
};
