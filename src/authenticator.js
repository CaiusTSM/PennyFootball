var Authenticator = function(app, database, validator) {
	// RPC functions called by client
	
	this.login = function(req, res) {
		console.log("POST " + JSON.stringify(req.body));
		
		if ("username" in req.body && "password" in req.body) {
			var username = req.body.username;
			var password = req.body.password;
			
			if (validator.validUsername(username) && validator.validPassword(password)) {
				database.userExists(username, password, function(exists) {
					if (exists === 0) {
						res.status(401);
						res.end();
					}
					else if (exists === 1) {
						req.session.authenticated = true;
						res.status(200);
						res.end();
					}
					else if (exists === 2) {
						res.status(401);
						res.end();
					}
				});
			}
		}
		else {
			res.status(401);
			res.end();
		}
	};
	
	this.logout = function(req, res) {
		if ("session" in req) {
			req.session.reset();
			res.status(200);
			res.end();
		}
		else {
			res.status(400);
			res.end();
		}
	};
	
	// Called internally
	
	this.authenticated = function(req) {
		if ("session" in req) {
			return (req.session.authenticated === true);
		}
		
		return false;
	};
	
	// Setup hooks for the RPC functions
	
	app.post("/api/login", this.login);
	app.post("/api/logout", this.logout);
};

module.exports = Authenticator;