var child_process = require("child_process");

var Game = require("./Game.js");
var GameClient = require("./GameClient.js");

var gameProcFile = __dirname + "/game_proc.js";

var GameRoom = function(io, uuid) {
	this.io = io;
	this.uuid = uuid;
	
	this.gameProc = child_process.fork(gameProcFile);
	
	this.game = new Game(this.io, this.uuid);
	this.game.init();
	
	this.clients = [];
	
	this.onConnect = function(socket) {
		this.clients.push(new GameClient(this.game, this.uuid, socket));
	};
	
	this.onDisconnect = function(socket) {
		for (var i = 0; i < this.clients.length; ++i) {
			var client = this.clients[i];
			if (client.socket.id === socket.id) {
				client.disconnect();
				this.clients.splice(i, 1);
				return true;
			}
		}
		
		return false;
	};
	
	this.startGame = function() {
		this.gameProc.send("start");
	};
	
	this.endGame = function() {
		this.gameProc.kill('SIGINT');
	};
	
	this.gameProc.on('message', function(msg) {
		this.io.to(this.uuid).emit("state", msg);
	}.bind(this));
};

module.exports = GameRoom;