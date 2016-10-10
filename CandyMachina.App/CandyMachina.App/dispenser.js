var sleep = require('sleep');
var wpw = require('wiring-pi-wrapper').WiringPiWrapper;
var pinLayout = require('wiring-pi-wrapper').PinLayout;
var pinModes = require('wiring-pi-wrapper').PinModes;

// Number of steps for a whole revelution.
var stepps = 4096,
    // Pulsewidth in microseconds;
    pulseWidth = 2000,
    //pin that we use to communicate with stepper driver
    signalPin = 4

wpw.setup(pinLayout.wpi);
var pin = wpw.setupPin(signalPin, pinModes.output);

function turn(callback) {
    var on = 1;
    
    for (var i = 0; i <= stepps; i++) {
        on = (on + 1) % 2;
        
        if (on == 1) {
            pin.write(true);
        }
        else {
            pin.write(false);
        }
        
        sleep.usleep(pulseWidth);
    }
}

module.exports = {
    turn: turn
};
