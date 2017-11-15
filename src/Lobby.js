var uuid = require("uuid/v4");

var Lobby = function(app, database, validator, gameServer) {
	this.database = database;
	this.gameServer = gameServer;
	
	// List of online users { username: username, time: new Date().getTime() }
	// Each user in list can expire over time and be removed by checkForDeadUsers
	this.onlineUsers = [];
	
	// List of invites { username1: username, username2: username, time: new Date().getTime() }
	// username1 is the one that sent the invite
	// Each invite can expire over time
	this.invites = [];
	
	this.addOnlineUser = function(username) {
		var foundUser = false;
		
		for (var i = 0; i < this.onlineUsers.length; ++i) {
			if (this.onlineUsers[i].username === username) {
				this.onlineUsers[i].time = new Date().getTime();
				foundUser = true;
				break;
			}
		}
		
		if (foundUser === false) {
			this.onlineUsers.push({ username: username, time: new Date().getTime() });
		}
	}.bind(this);
	
	this.removeDeadUsers = function() {
		// Current time in miliseconds
		var time = new Date().getTime();
		// It is in miliseconds so * 1000
		// 1/2 minute
		var timeout = 1000 * 60 * 0.5;
		
		for (var i = 0; i < this.onlineUsers.length; ++i) {
			// If time passed since add to list > timeout
			if (time - this.onlineUsers[i].time > timeout) {
				// Remove old user
				this.onlineUsers.splice(i, 1);
			}
		}
	}.bind(this);
	
	this.userOnline = function(username) {
		for (var i = 0; i < this.onlineUsers.length; ++i) {
			if (this.onlineUsers[i].username === username) {
				return true;
			}
		}
		
		return false;
	}.bind(this);
	
	this.addInvite = function(username1, username2) {
		var foundInvite = false;
		
		for (var i = 0; i < this.invites.length; ++i) {
			var invite = this.invites[i];
			
			if (invite.username1 === username1 && invite.username2 === username2) {
				invite.time = new Date().getTime();
				foundInvite = true;
				break;
			}
		}
		
		if (foundInvite === false) {
			this.invites.push({ username1: username1, username2: username2, time: new Date().getTime() });
		}
	}.bind(this);
	
	this.removeDeadInvites = function() {
		// Current time in miliseconds
		var time = new Date().getTime();
		// It is in miliseconds so * 1000
		// 1 minute
		var timeout = 1000 * 60 * 1;
		
		for (var i = 0; i < this.invites.length; ++i) {
			// If time passed since add to list > timeout
			if (time - this.invites[i].time > timeout) {
				// Remove old invite
				this.invites.splice(i, 1);
			}
		}
	}.bind(this);
	
	this.removeInvite = function(username1, username2) {
		for (var i = 0; i < this.invites.length; ++i) {
			var invite = this.invites[i];
			
			if (invite.username1 === username1 && invite.username2 === username2) {
				this.invites.splice(i, 1);
				break;
			}
		}
	}.bind(this);
	
	// Callbacks below
	
	this.onPing = function(req, res) {
		if (req.session.authenticated === true) {
			this.addOnlineUser(req.session.username);
			
			res.status(200);
			res.end();
		}
		else {
			res.status(401);
			res.end();
		}
	}.bind(this);
	
	this.onOnline = function(req, res) {
		if (req.session.authenticated === true) {
			this.removeDeadUsers();
			
			var list = [];
			
			for (var i = 0; i < this.onlineUsers.length; ++i) {
				if (this.onlineUsers[i].username !== req.session.username) {
					list.push(this.onlineUsers[i].username);
				}
			}
			
			res.send({ onlineUsers: list });
			res.end();
		}
		else {
			res.status(401);
			res.end();
		}
	}.bind(this);
	
	this.onInvite = function(req, res) {
		if (req.session.authenticated === true) {
			if ("username" in req.body) {
				var username2 = req.body.username;
				
				this.addInvite(req.session.username, username2);
				
				console.log(JSON.stringify(this.invites));
				
				res.status(200);
				res.end();
			}
			else {
				res.status(400);
				res.end();
			}
		}
		else {
			res.status(401);
			res.end();
		}
	}.bind(this);
	
	this.onInvites = function(req, res) {
		if (req.session.authenticated === true) {
			var username = req.session.username;
			
			this.removeDeadInvites();
			
			var list = [];
			
			for (var i = 0; i < this.invites.length; ++i) {
				var invite = this.invites[i];
				
				if (invite.username1 !== username && invite.username2 === username) {
					list.push(invite.username1);
				}
			}
			
			res.send({ invites: list });
			res.end();
		}
		else {
			res.status(401);
			res.end();
		}
	}.bind(this);
	
	this.onAcceptInvite = function(req, res) {
		if (req.session.authenticated === true) {
			var username2 = req.session.username;
			
			if ("username" in req.body) {
				var username1 = req.body.username;
				
				// UUID = unqiue universal identifier (aka long random string)
				var id = uuid();
				
				this.database.insertGame(username1, username2, id, function(inserted) {
					if (inserted === 0) {
						res.status(400);
						res.end();
					}
					else if (inserted === 1) {
						this.gameServer.createGameRoom(id);
						
						res.send({ gameId: id });
						res.end();
					}
				});
			}
			else {
				res.status(400);
				res.end();
			}
		}
		else {
			res.status(401);
			res.end();
		}
	}.bind(this);
	
	this.onDeclineInvite = function(req, res) {
		if (req.session.authenticated === true) {
			var username2 = req.session.username;
			
			if ("username" in req.body) {
				var username1 = req.body.username;
			
				this.removeInvite(username1, username2);
				
				res.status(200);
				res.end();
			}
			else {
				res.status(400);
				res.end();
			}
		}
		else {
			res.status(401);
			res.end();
		}
	}.bind(this);
	
	// Add user to list
	app.post("/api/lobby/ping", this.onPing);
	
	// Get list of usernames of users online
	app.get("/api/lobby/online", this.onOnline);
	
	// Add invite to list
	app.post("/api/lobby/invite", this.onInvite);
	
	// Get list of pending invites
	app.get("/api/lobby/invites", this.onInvites);
	
	app.post("/api/lobby/accept", this.onAcceptInvite);
	app.post("/api/lobby/decline", this.onDeclineInvite);
};

module.exports = Lobby;