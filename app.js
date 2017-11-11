var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var watch = require('node-watch');;
var bodyParser = require('body-parser');
var sessions = require("client-sessions");
var mysql = require('mysql');

var Database = require('./src/database.js');
var Validator = require('./src/validator.js');
var Registrar = require('./src/registrar.js');
var Authenticator = require('./src/authenticator.js');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(err, req, res, next) {
	console.log(error.stack);
	res.status(500).send("Something broke! xd");
});

app.use(sessions({
	cookieName: 'session',
	secret: 'blargadeeblargblarg',
	duration: 24 * 60 * 60 * 1000,
	activeDuration: 1000 * 60 * 5
}));

var database = new Database("localhost", "root", "");
var validator = new Validator();
var registrar = new Registrar(app, database, validator);
var auth = new Authenticator(app, database, validator);

database.connect(
function() {
	console.log("Database is ready...");
},
function(err) {
	console.log("Failed to connect to database.");
});

var IP = "0.0.0.0";
var PORT = 8080;

var publicDir = __dirname + "/public/";

var changed = [];

var onlineUsers = ["lucas", "sean", "rh3894h_bob"];

app.get("/onlineUsers", function(req, res) {
	console.log("Getting user table");
	res.send({onlineUsers: onlineUsers});
	res.end();
});

app.get("/user/*", function(req, res) {
	if (auth.authenticated(req)) {
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