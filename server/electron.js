"use strict";

try {

  require('./lib/server.js').listen(3000);

}
catch(e) {

  console.error(e);
  process.exit(0);

}

var TITLE = 'Kalzate';

var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.

// Quit when all windows are closed.
app.on('window-all-closed', function() {

    app.quit();

});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {

    //require('./server.js');

    // Create the browser window, .
    var mainWindow = new BrowserWindow({
        //'transparent': true,
        'auto-hide-menu-bar':true,
        //frame: false,
        //'skip-taskbar': true,
        title: TITLE,
        center: true,
        //'fullscreen': true,
        'web-preferences': {

          'web-security': false

        }
    });

    //mainWindow.loadUrl('file://' + __dirname + '/app/index.html');
    //mainWindow.loadUrl('http://192.168.77.2:3000');
    mainWindow.loadUrl('http://localhost:3000');

    // Open it maximized
    mainWindow.maximize();

    //mainWindow.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {

        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;

    });

});
