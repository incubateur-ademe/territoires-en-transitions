var path = require('path');
var express = require('express');
var app = express();
var directory = '/' + (process.env.STATIC_DIR || 'build')
app.use(express.static(__dirname + directory));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + directory + '/index.html'));
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Listening on', port);
});