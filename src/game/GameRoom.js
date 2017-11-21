var child_process = require("child_process");

var Game = require("./Game.js");
var GameClient = require("./GameClient.js");

var gameProcFile = __dirname + "/game_proc.js";

var GameRoom = function(io, uuid, username1, username2) {
	this.io = io;
	this.uuid = uuid;
	
	this.username1 = username1;
	this.username2 = username2;
	
	this.creationTime = new Date().getTime();
	
	this.gameProc = child_process.fork(gameProcFile);
	
	this.running = false;
	
	this.clients = [];
	
	this.turn = true;
	this.winner = 0;
	
	this.startGame = function() {
		this.gameProc.send("start");
		this.running = true;
	};
	
	this.endGame = function() {
		if (this.running === true) {
			this.gameProc.kill('SIGINT');
			this.running = false;
		}
		
		for (var i = 0; i < this.clients.length; ++i) {
			this.clients[i].terminate(this.winner);
		}
		
		console.log("Game room closed: " + this.uuid);
	};
	
	this.onConnect = function(socket) {
		if (this.clients.length < 2) {
			if (this.clients.length === 0) {
				this.clients.push(new GameClient(this, this.uuid, socket, this.username1, true));
			}
			else {
				if (this.clients[0].username === this.username1) {
					this.clients.push(new GameClient(this, this.uuid, socket, this.username2, false));
				}
				else {
					this.clients.push(new GameClient(this, this.uuid, socket, this.username1, true));
				}
			}
		}
		
		return true;
	}.bind(this);
	
	this.onDisconnect = function(socket) {
		for (var i = 0; i < this.clients.length; ++i) {
			var client = this.clients[i];
			if (client.socket.id === socket.id) {
				client.disconnect();
				
				this.clients.splice(i, 1);
				
				if (this.clients.length === 0) {
					this.endGame();
				}
				
				return true;
			}
		}
		
		return false;
	}.bind(this);
	
	this.onMove = function(socket, move) {
		this.gameProc.send({ input: move });
	}.bind(this);
	
	this.onTimeout = function() {
		if (this.clients.length < 2) {
			this.endGame();
		}
	}.bind(this);
	
	this.gameProc.on('message', function(msg) {
		if (msg === "player A wins") {
			this.winner = 1;
			this.endGame();
		}
		else if (msg === "player B wins") {
			this.winner = 2;
			this.endGame();
		}
		else {
			for (var i = 0; i < this.clients.length; ++i) {
				this.clients[i].turn = msg.turn;
				this.clients[i].sendState(msg);
			}
		}
	}.bind(this));
};

module.exports = GameRoom;