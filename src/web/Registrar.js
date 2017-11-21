var Registrar = function(app, database, validator) {
	this.register = function(req, res) {
		console.log("Register: " + JSON.stringify(req.body));
	
		if ("username" in req.body && "password" in req.body) {
			var username = req.body.username;
			var password = req.body.password;
	
			if (validator.validUsername(username) && validator.validPassword(password)) {
				database.usernameTaken(username, function(taken) {
					if (taken === 0) {
						database.insertUser(username, password, function(success) {
							if (success === 0) {
								res.status(400);
								res.end();
							}
							else if (success === 1) {
								res.status(200);
								res.end();
							}
						});
					}
					else if (taken === 1) {
						res.status(400);
						res.end();
					}
					else if (taken === 2) {
						res.status(400);
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
			res.status(400);
			res.end();
		}
	};
	
	app.post("/api/register", this.register);
};

module.exports = Registrar;