require('dotenv').config();
const path = require('path');
const express = require('express');
const httpProxy = require('http-proxy');
const zipUrls = require('./src/server/zipUrls');

const app = express();
const directory = '/' + (process.env.STATIC_DIR || 'build');
app.use(express.static(__dirname + directory));

// redirection des requêtes sur posthog
const proxy = httpProxy.createProxyServer();
app.use('/ingest', (req, res) => {
  proxy.web(req, res, {
    target: 'https://eu.posthog.com',
    changeOrigin: true,
    secure: true,
    xfwd: true,
    headers: {
      // These headers aren't necessary, but are useful for our metrics.
      'X-Real-IP': req.ip,
      'X-Forwarded-For': req.ip,
      'X-Forwarded-Host': req.hostname,
    },
  });
});

app.use(express.json()); // for parsing application/json
app.post('/zip', zipUrls);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + directory + '/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Listening on', port);
});
