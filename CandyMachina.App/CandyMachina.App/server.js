var app = require('express')();
var http = require('http').createServer(app);
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
var curTime = new Date().getTime();
var nextUpdate = curTime;
var nextShallowUpdate = curTime;

http.listen(config['port'], function () {
    console.log('listening on *:' + config['port']);
});

function twitterTags() {
    var data = "";
    for (key in settings.twitter.tags) {
        data += data.length == 0 ? '' : ',';
        data += '#' + settings.twitter.tags[key];
    }
    return data;
}

var camera = cv ? new cv.VideoCapture(0) : console.log("cv not found");
if (camera) {
    camera.setWidth(config['image-width']);
    camera.setHeight(config['image-height']);
}

var COLOR = [0, 255, 0]; // default red
var THICKSNESS = 2; // default 1
var DELAY_IN_SEC = 20 * 1000;
var SHALLOWUDATE_IN_SEC = 1 * 1000;
var imageBuffer;

function onSmileFound(err, mouth) {
    if (err) throw err;
    console.log("found mouths: " + mouth.length + " " + (curTime > nextUpdate));
    if (mouth.length > 0 && curTime > nextUpdate) {
        console.log('Smile detected');
        if (settings.twitter.enable) {
            console.log("i am now tweeting");
            var image = this;
            setTimeout(function() {
                twitter.postImage(settings.twitter.message, twitterTags(), imageBuffer);
            }, 1);
        } else {
            console.log("twitter is disabled");
        }
        dispenser.turn();
        nextUpdate = curTime + DELAY_IN_SEC;
    } else {
        console.log("found no mouth");
    }
}

function onFaceFound(err, faces) {
    if (err) throw err;
    console.log("found faces: " + faces.length);
    if(faces.length > 0) {
        var oldFace = faces[0];
        var im2 = this.roi(oldFace.x, oldFace.y, oldFace.width, oldFace.height);
        for (var i = 0; i < faces.length; i++) {
            var face = faces[i];

            if (face.width > oldFace.width && face.height > oldFace.height) {
                oldFace = face;
                im2 = this.roi(face.x, face.y, face.width, face.height);
            }
        }
        im2.detectObject('haarcascades/smiled_01.xml', {}, onSmileFound.bind(this));
    }
}

function analyzeAndSendImage() {
    if (camera) {
        curTime = new Date().getTime();
        camera.read(function (err, im) {
            if (err) throw err;
            if (im.width() < 1 || im.height() < 1) return;
            im.convertGrayscale();
            imageBuffer = im.toBuffer();
            if (curTime > nextUpdate && curTime > nextShallowUpdate) {
                nextShallowUpdate = curTime + SHALLOWUDATE_IN_SEC;
                console.log("updating: " + ((curTime - nextUpdate)/1000));
                im.detectObject('haarcascades/haarcascade_frontalface_alt.xml', {}, onFaceFound.bind(im));
            }
        });
    }
}

var intervalObj = setInterval(analyzeAndSendImage, 1000);

var index = fs.readFileSync(__dirname + "/client.html", 'utf8').replace(/{url}/g, '192.168.1.37' + ':' + config['port']);
app.get('/', function (req, res) {
    res.send(index);
});

app.get('/turn', function (req, res) {
    res.send('turning one complete rotation');
    dispenser.turn();
});
