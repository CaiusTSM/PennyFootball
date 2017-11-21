var WebServer = require("./src/web/WebServer.js");

var webServer = new WebServer();

webServer.init("0.0.0.0", 8080, __dirname + "/public/");

webServer.start();