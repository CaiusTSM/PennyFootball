var mysql = require('mysql');

var Database = function(host, user, pass) {
	this.queryInsertNewUser = "INSERT INTO users (username, password, wins, losses) VALUES (?, ?, 0, 0)";
	this.queryMatchingUsersCount = "SELECT COUNT(*) FROM users WHERE username = ? AND password = ?";
	this.queryUsernameExists = "SELECT COUNT(*) FROM users WHERE username = ?";
	this.queryInsertGame = "INSERT INTO ongoing_games (username1, username2, uuid) VALUES (?, ?, ?)";
	
	this.database = mysql.createConnection({
		host: host,
		user: user,
		password: pass
	});
	
	this.connect = function(callback_success, callback_failure) {
		var database = this.database;
		
		database.connect(function(err) {
			if (err) {
				callback_failure(err);
			}
			else {
				database.query("USE penny_football", function(error, result) {
					if (error) {
						callback_failure(error);
					}
					else {
						callback_success();
					}
				});
			}
		});
	};
	
	// 0 is false (failure), 1 is true (success)
	this.insertUser = function(username, password, callback) {
		this.database.query(this.queryInsertNewUser, [username, password], function(err, result) {
			if (err) {
				callback(0);
			}
			else {
				callback(1);
			}
		});
	};
	
	// 0 returns false (User DNE), 1 return true, 2 returns error
	this.userExists = function(username, password, callback) {
		this.database.query(this.queryMatchingUsersCount, [username, password], function(err, result) {
	    	if (err) {
				callback(2);
	    	}
	    	else if (result.length === 1) {
	    		var resultObject = result[0];
	    		var count = resultObject["COUNT(*)"];
	    	
	    		if (count === 1) {
	    			callback(1);
	    		}
	    		else {
	    			callback(0);
	    		}
	    	}
	    	else {
	    		callback(2);
	    	}
		});
	};
	
	// 0 returns false (username not taken), 1 returns true, 2 returns error
	this.usernameTaken = function(username, callback) {
		this.database.query(this.queryUsernameExists, [username], function(err, result) {
			if (err) {
				callback(2);
			}
			else if (result.length === 1) {
				var resultObject = result[0];
				var count = resultObject["COUNT(*)"];
				
				if (count > 0) {
					callback(1);
				}
				else {
					callback(0);
				}
			}
			else {
				callback(2);
			}
		});
	};
	
	// 0 is false (failure), 1 is true (success)
	this.insertGame = function(username1, username2, gameId, callback) {
		this.database.query(this.queryInsertGame, [username1, username2, gameId], function(err, result) {
			if (err) {
				callback(0);
			}
			else {
				callback(1);
			}
		});
	};
};

module.exports = Database;