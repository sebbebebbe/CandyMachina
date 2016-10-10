# CandyMachina Nodejs


Setup on raspberry pi

    1. Install node 6.x 
		a. curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
		b. sudo apt install -y nodejs
    2. Install and compile OpenCV
		a. http://www.pyimagesearch.com/2015/10/26/how-to-install-opencv-3-on-raspbian-jessie/
    3. Install Python
    4. Download and install wiringpi (http://wiringpi.com/download-and-install/)
        a. Follow wiringpi instructions
    3. sudo npm install
    6. sudo node-gyp configure build
    7. sudo node server.js
    8. fill out secrets.json with your own twitter info