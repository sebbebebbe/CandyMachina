var fs = require('fs');

var sysFsPath = '/sys/class/gpio/gpio',
    // Number of steps for a whole revelution.
    stepps = 4096,
    // Pulsewidth in ms;
    pulseWidth = 50,
    pinMapping = {
        '16': 23
    };

function noOp() {}

function open(pinNumber, direction, callback) {
    var path = sysFsPath + pinMapping[pinNumber] + '/direction';

    fs.writeFile(path, direction, (callback || noOp));
}

function write(pinNumber, value, callback) {
    var path = sysFsPath + pinMapping[pinNumber] + '/value';
    value = !!value ? '1' : '0';

    fs.writeFile(path, value, 'utf8', callback);
}

function turn(callback) {
    var on;

    open(16, 'out', function () {
        console.log("Pin 16 is open!");

        for (var i = 0; i <= stepps, i++) {
            write(16, on, function () {
                on = (on + 1) % 2;
                console.log(on);
                sleep(pulseWidth);
            });
        }
    });
}

module.exports = {
    turn: turn
};