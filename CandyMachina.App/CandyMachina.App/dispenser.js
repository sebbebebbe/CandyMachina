var fs = require('fs');
var sleep = require('sleep');
var wpw = require( 'wiring-pi-wrapper' ).WiringPiWrapper;
var pinLayout = require('wiring-pi-wrapper').PinLayout;
var pinModes = require('wiring-pi-wrapper').PinModes;

var sysFsPath = '/sys/class/gpio/gpio',
    // Number of steps for a whole revelution.
    stepps = 4096,
    // Pulsewidth in microseconds;
    pulseWidth = 2000,
    pinMapping = {
        '16': 23
    };

wpw.setup(pinLayout.wpi);
var pin = wpw.setupPin(4, pinModes.output);

function noOp() {}

function open(pinNumber, direction, callback) {
    var path = sysFsPath + pinMapping[pinNumber] + '/direction';

    fs.writeFile("/sys/class/gpio/export/" + pinMapping[pinNumber] , (callback || noOp));

    fs.writeFile(path, direction, (callback || noOp));
}

function write(pinNumber, value, callback) {
    var path = sysFsPath + '23' + '/value';
    value = !!value ? '1' : '0';

    fs.writeFile(path, value, 'utf8', callback);
}

function turn(callback) {
    var on = 1;

        for (var i = 0; i <= stepps; i++) {
      		on = (on + 1) % 2;
        	
		if(on == 1)
		{
			//console.log('1')
			pin.write(true);
		}
		else
		{
			//console.log('0');
			pin.write(false);
		}
		sleep.usleep(pulseWidth);
        }
}

module.exports = {
    turn: turn
};
