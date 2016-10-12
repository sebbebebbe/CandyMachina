var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');
var configLoader = require('config-json');
var cv = require('opencv');
var twitter = require('./twitter');
var dispenser = require('./dispenser');

var settings = require('./settings.json');
configLoader.load('./config.json');

var intervalObj;
var config = configLoader.get();
var process;
var isStreaming = false;
var nextUpdate = new Date().getTime();


//dsiabled for now since its simpler to test remotely
//io.origins(config['client-host'] + ':' + config['client-port']);

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

function twitterTags() {
    var data = "";
    for (key in settings.twitter.tags) {
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

var camera = cv ? new cv.VideoCapture(0) : console.log("cv not found");
if (camera) {
    camera.setWidth(config['image-width']);
    camera.setHeight(config['image-height']);
}

var COLOR = [0, 255, 0]; // default red
var THICKSNESS = 2; // default 1
var DELAY_IN_SEC = 20 * 1000;  

function onSmileFound(err, mouth) {
    if (err) throw err;
    if (mouth.length > 0) {
        if (settings.twitter.enable) {
            console.log("i am now tweeting);
            this.convertGrayscale();
            twitter.postImage(settings.twitter.message, twitterTags(), this.toBuffer());
        } else {
            console.log("twitter is disabled");
        }
        console.log('Smile detected');
        dispenser.turn();
        console.log("mouth cordinates: " + mouth[0].x + ' ' + mouth[0].y);
        //this.rectangle([face.x + mouth[0].x, face.y + mouth[0].y], [mouth[0].width, mouth[0].height], [0, 255, 255], 2);
        io.sockets.emit('live-stream', {
            buffer: this.toBuffer()
        });
    } else {
        console.log("found no mouth");
    }
}

function onFaceFound(err, faces) {
    if (err) throw err;
    console.log("found faces: " + faces.length);
    var oldFace = faces[0];
    var im2 = this.roi(oldFace.x, oldFace.y, oldFace.width, oldFace.height);
    for (var i = 0; i < faces.length; i++) {
        var face = faces[i];
        this.rectangle([face.x, face.y], [face.width, face.height], COLOR, THICKSNESS);

        if (face.width > oldFace.width && face.height > oldFace.height) {
            oldFace = face;
            im2 = this.roi(face.x, face.y, face.width, face.height);
        }
    }
    im2.detectObject('haarcascades/smiled_01.xml', {}, onSmileFound.bind(this));
}

function analyzeAndSendImage() {
    if (camera) {
        var curTime = new Date().getTime();
        camera.read(function (err, im) {
            if (err) throw err;
            if (im.width() < 1 || im.height() < 1) return;

            if (curTime > nextUpdate) {
                console.log("updating: " + (curTime - nextUpdate));
                im.detectObject('haarcascades/haarcascade_frontalface_alt.xml', {}, onFaceFound.bind(im));
                nextUpdate = curTime + DELAY_IN_SEC;
            }
            io.sockets.emit('live-stream', {
                buffer: im.toBuffer()
            });
        });
    }
}

function getAbsoluteImagePath() {
    return path.join(config['image-path'], config['image-name']);
}

var index = fs.readFileSync(__dirname + "/client.html", 'utf8').replace(/{url}/g, '192.168.1.37' + ':' + config['port']);
app.get('/', function (req, res) {
    res.send(index);
});

app.get('/turn', function (req, res) {
    res.send('turning one complete rotation');
    dispenser.turn();
});
