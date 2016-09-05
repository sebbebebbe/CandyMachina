var http = require('http');
var port = process.env.port || 8000;

var raspivid = require('raspivid');
var fs = require('fs');

var file = fs.createWriteStream(__dirname + '/video.h264');
var video = raspivid();


http.createServer(function (req, res) {
    video.pipe(file);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('<video width="320" height="240" autoplay>< source src="/video.h264" type= "video/mp4" >Your browser does not support the video tag.</video>>');
}).listen(port);