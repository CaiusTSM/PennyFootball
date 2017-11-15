var GameRoom = require("./GameRoom.js");
var uuid = require("uuid/v4");

var GameServer = function(io) {
	this.io = io;
	
	this.rooms = [];
	
	this.io.on("connection", function(socket) {
		socket.on("join", function(data) {
			if ("gameId" in data) {
				if (typeof data.gameId === "string") {
					var uuid = data.gameId;
					
					for (var i = 0; i < this.rooms.length; ++i) {
						var room = this.rooms[i];
						if (room.uuid === uuid) {
							console.log("Player joined #[" + room.uuid + "]...");
							room.onConnect(socket);
							socket.emit("joined");
							break;
						}
					}
				}
			}
		}.bind(this));
		
		socket.on("disconnect", function() {
			for (var i = 0; i < this.rooms.length; ++i) {
				var room = this.rooms[i];
				var disconnected = room.onDisconnect(socket);
				if (disconnected === true) {
					console.log("Played parted #[" + room.uuid + "]...");
					break;
				}
			}
		}.bind(this));
	}.bind(this));
	
	this.createGameRoom = function() {
		// TODO change this, this is for testingto have an ID I can guess
		var room = new GameRoom(this.io, "1");
		this.rooms.push(room);
		room.startGame();
	};
	
	this.createGameRoom();
};

module.exports = GameServer;