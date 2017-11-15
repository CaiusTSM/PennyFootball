var GameClient = function(game, gameId, socket) {
	this.game = game;
	this.gameId = gameId;
	this.socket = socket;
	
	this.onInput = function(data) {
		// TODO check input
		console.log("Got input: " + JSON.stringify(data));
		this.game.pushInput(this, data);
	};
	
	this.disconnect = function() {
		this.socket.leave(this.gameId);
	};
	
	this.socket.join(this.gameId);
	this.socket.on("input", this.onInput);
};

module.exports = GameClient;