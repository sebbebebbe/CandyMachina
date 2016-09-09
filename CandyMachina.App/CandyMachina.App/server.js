﻿var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');
var configLoader = require('config-json');
var cv = require('opencv');

var settings = require('./settings.json');
configLoader.load('./config.json');

var intervalObj;
var config = configLoader.get();
var process;
var isStreaming = false;

io.origins(config['client-host'] + ':' + config['client-port']);

http.listen(config['port'], function () {
    console.log('listening on *:' + config['port']);
});

io.on('connection', function (socket) {
    socket.on('start-stream', function () {
        if (!isStreaming) {
            startStreaming();
        } else {
            sendImage();
        }
    });

    socket.on('disconnect', function () {
        if (io.engine.clientsCount == 0) {
            stopStreaming();
        }
    });
});

+function renderTags() {
        var data = "";
        for(key in settings.twitter.tags) {
                data += data.length == 0 ? '' : ',';
                data += '#' + settings.twitter.tags[key];
            }
        return data;
    }

function startStreaming() {
    console.log('Starting stream.');
    isStreaming = true;
    intervalObj = setInterval(analyzeAndSendImage, config['capture-rate']);
}

function stopStreaming() {
    console.log('Stopping stream.');
    isStreaming = false;
    clearInterval(intervalObj);
}

var camera = new cv.VideoCapture(0);
camera.setWidth(config['image-width']);
camera.setHeight(config['client-height']);

var COLOR = [0, 255, 0]; // default red
var thickness = 2; // default 1

function analyzeAndSendImage() {

    camera.read(function (err, im) {
        if (err) throw err;
        if (im.width() < 1 || im.height() < 1) return;
        
        im.detectObject('/haarcascades/haarcascade_eye_tree_eyeglasses.xml', {}, function (err, faces) {
            if (err) throw err;

            for (var i = 0; i < faces.length; i++) {
                face = faces[i];
                im.rectangle([face.x, face.y], [face.width, face.height], COLOR, 2);
            }

            io.sockets.emit('live-stream', { buffer: im.toBuffer() });
        });

    });
}

function getAbsoluteImagePath() {
    return path.join(config['image-path'], config['image-name']);
}

var index = fs.readFileSync(__dirname + "client.html", 'utf8').replace('{url}',  'candymachina'  + ':' + config['port']);
app.get('/', function (req, res) {
	res.send(index);
});

