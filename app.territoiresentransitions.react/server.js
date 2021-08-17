const path = require('path');
const express = require('express');
const app = express();
const directory = '/' + (process.env.STATIC_DIR || 'build');
app.use(express.static(__dirname + directory));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + directory + '/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Listening on', port);
});
