var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var watch = require('node-watch');;
var bodyParser = require('body-parser');
var sessions = require("client-sessions");
var mysql = require('mysql');

var IP = "0.0.0.0";
var PORT = 8080;

//var publicDir = "C:/Users/Lucas/Google Drive/agile/public/";
var publicDir = __dirname + "/public/";

var app = express();

var changed = [];

var users = [];

var database = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: ""
});

database.connect(function(err) {
	if (err) throw err;
	console.log("Connected to database...");
	database.query("USE penny_football", function (err, result) {
    	console.log("Using database: penny_football...");
	});
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(sessions({
	cookieName: 'session',
	secret: 'blargadeeblargblarg',
	duration: 24 * 60 * 60 * 1000,
	activeDuration: 1000 * 60 * 5
}));

app.use(function(err, req, res, next) {
	console.log(error.stack);
	res.status(500).send("Something broke! xd");
});

app.get("/user/*", function(req, res) {
	if (req.session.authenticated === true) {
		res.status(200);
		res.sendFile(publicDir + req.url);
	}
	else {
		res.status(401);
		res.send("Access Denied.");
	}
});

app.get("/*", function(req, res) {
	console.log("GET " + req.url);
	res.sendFile(publicDir + req.url);
});

app.post("/register", function(req, res) {
	console.log("POST " + JSON.stringify(req.body));
	res.status(200);
	res.end();
});

app.post("/login", function(req, res) {
	console.log("POST " + JSON.stringify(req.body));
	
	if ("username" in req.body && "password" in req.body) {
		database.query("SELECT COUNT(*) FROM users WHERE username = ? AND password = ?", [req.body.username, req.body.password], function (err, result) {
	    	if (result.length === 1) {
	    		var resultObject = result[0];
	    		
	    		var count = resultObject["COUNT(*)"];
	    		
	    		if (count === 1) {
	    			req.session.authenticated = true;
					res.status(200);
					res.end();
	    		}
	    		else {
	    			res.status(401);
	    			res.end();
	    		}
	    	}
	    	else {
	    		res.status(401);
	    		res.end();
	    	}
		});
	}
	else {
		res.status(401);
		res.end();
	}
});

var server = http.createServer(app);

var io = socketio(server);

io.on('connection', function(socket) {
	console.log(socket.handshake.address + " connected.");
	
	socket.userName = "";
	
	socket.on('disconnect', function() {
		if (socket.userName !== "") {
			var userIndex = users.indexOf(socket.userName);
			if (userIndex !== -1) {
				users.splice(userIndex, 1);
				socket.broadcast.emit("parted", { name: socket.userName });
				console.log(socket.userName + " parted.");
			}
		}
		
		console.log(socket.handshake.address + " disconnected.");
	});
	
	socket.on('join', function(data) {
		if ("name" in data) {
			if (data.name.length < 20) {
				console.log(data.name + " joined.");
				
				socket.userName = data.name;
				users.push(data.name);
				socket.broadcast.emit('joined', { name: socket.userName });
				socket.emit('join success', { users: users });
			}
		}
	});
});

var reloadClientsTimer = setInterval(function() {
	if (changed.length > 0) {
		io.emit("file changed", { changedList: changed });
		changed = [];
	}
}, 500);

watch(publicDir, { recursive: true }, function(evt, name) {
	var sp = name.split("\\").join("/").split("/");
	changed.push(sp[sp.length - 1]);
});

server.listen(PORT, IP, function() {
	console.log("Server is running...");
});