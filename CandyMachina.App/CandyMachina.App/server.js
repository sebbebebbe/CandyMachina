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

var config = configLoader.get();
var curTime = new Date().getTime();
var nextUpdate = curTime;
var nextShallowUpdate = curTime;

http.listen(config['port'], function () {
    
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

var DELAY_IN_SEC = 20 * 1000;
var SHALLOWUDATE_IN_SEC = 1 * 1000;
const CLASSIFIER_FACE = 'haarcascades/haarcascade_frontalface_alt.xml';
const CLASSIFIER_SMILE = 'haarcascades/smiled_01.xml';
var imageBuffer;

function onSmileFound(err, mouth) {
    if (err) throw err;
    if (mouth.length > 0 && curTime > nextUpdate) {
        if (settings.twitter.enable) {
            setTimeout(function() {
                twitter.postImage(settings.twitter.message, twitterTags(), imageBuffer);
            }, 1);
        }
        dispenser.turn();
        nextUpdate = curTime + DELAY_IN_SEC;
    }
}

function onFaceFound(err, faces) {
    if (err) throw err;
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
        im2.detectObject(CLASSIFIER_SMILE, {}, onSmileFound.bind(this));
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
                im.detectObject(CLASSIFIER_FACE, {}, onFaceFound.bind(im));
            }
        });
    }
}


setInterval(analyzeAndSendImage, 1000);


//Give free candy
app.get('/turn', function (req, res) {
    res.send('turning one complete rotation');
    dispenser.turn();
});

//take picture and give candy
app.get('/capture', function (req, res) {
    res.send('manual capture and dispensing');
    dispenser.turn();
});
