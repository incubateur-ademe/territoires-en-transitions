require('dotenv').config();
const path = require('path');
const express = require('express');
const {createProxyMiddleware} = require('http-proxy-middleware');
const zipUrls = require('./src/server/zipUrls');

const app = express();
const directory = '/' + (process.env.STATIC_DIR || 'build');
app.use(express.static(__dirname + directory));

// redirection des requêtes sur posthog
app.use(
  '/ingest',
  createProxyMiddleware('/ingest', {
    target: 'https://eu.posthog.com',
    changeOrigin: true,
  })
);

app.use(express.json()); // for parsing application/json
app.post('/zip', zipUrls);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + directory + '/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Listening on', port);
});
