var GameRoom = require("./GameRoom.js");

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
							var connected = room.onConnect(socket);
							if (connected === true) {
								socket.emit("joined");
							}
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
	
	this.createGameRoom = function(id, username1, username2) {
		console.log("Created game room: " + id);
		var room = new GameRoom(this.io, id, username1, username2);
		this.rooms.push(room);
		room.startGame();
		
		setTimeout(room.onTimeout, 1000 * 60 * 1);
		
		return id;
	};
	
	this.deleteGameRoom = function(id) {
		for (var i = 0; i < this.rooms.length; ++i) {
			var room = this.rooms[i];
			
			if (room.uuid === id) {
				room.endGame();
				this.rooms.splice(i, 1);
			}
		}
	};
};

module.exports = GameServer;