var mysql = require('mysql');

var Database = function(host, user, pass) {
	this.queryInsertNewUser = "INSERT INTO users (username, password, wins, losses) VALUES (?, ?, 0, 0)";
	this.queryMatchingUsersCount = "SELECT COUNT(*) FROM users WHERE username = ? AND password = ?";
	this.queryUsernameExists = "SELECT COUNT(*) FROM users WHERE username = ?";
	
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
	
	//0 returns false (User DNE), 1 return true, 2 returns error
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
	
	//0 returns false (username not taken), 1 returns true, 2 returns error
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
	}
};

module.exports = Database;