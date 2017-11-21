var GameClient = function(gameRoom, gameId, socket, username, myTurn) {
	this.gameRoom = gameRoom;
	this.gameId = gameId;
	this.socket = socket;
	this.username = username;
	this.myTurn = myTurn;
	
	this.turn = true;
	
	this.onInput = function(data) {
		// TODO check input
		if ("id" in data && "strength" in data && "angle" in data) {
			if (this.turn === this.myTurn) {
				this.gameRoom.onMove(this.socket, data);
			}
		}
	}.bind(this);
	
	this.disconnect = function() {
		this.socket.leave(this.gameId);
	}.bind(this);
	
	this.terminate = function(winner) {
		// TODO
		socket.emit("game over", { winner: winner });
	}.bind(this);
	
	this.sendState = function(data) {
		if (data.turn === this.myTurn) {
			data.turn = true;
		}
		else {
			data.turn = false;
		}
		
		this.socket.emit("state", data);
	}.bind(this);
	
	this.socket.join(this.gameId);
	this.socket.on("input", this.onInput);
};

module.exports = GameClient;