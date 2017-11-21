var GameClient = function(gameRoom, gameId, socket, username) {
	this.gameRoom = gameRoom;
	this.gameId = gameId;
	this.socket = socket;
	this.username = username;
	
	this.onInput = function(data) {
		// TODO check input
		if ("id" in data && "strength" in data && "angle" in data) {
			this.gameRoom.onMove(this.socket, data);
		}
	}.bind(this);
	
	this.disconnect = function() {
		this.socket.leave(this.gameId);
	}.bind(this);
	
	this.terminate = function() {
		// TODO
	}.bind(this);
	
	this.sendState = function(data) {
		this.socket.emit("state", data);
	}.bind(this);
	
	this.socket.join(this.gameId);
	this.socket.on("input", this.onInput);
};

module.exports = GameClient;