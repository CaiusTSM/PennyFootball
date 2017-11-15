var Game = require("./Game.js");

var game = new Game();
game.init();

process.on('message', function(msg) {
	if (msg === "start") {
		game.start();
		console.log("Started Game...");
	}
});