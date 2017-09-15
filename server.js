var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var socketio = require('socket.io');
var watch = require('node-watch');;

var port = 8000;

//var publicDir = "C:/Users/Lucas/Google Drive/agile/public/";
var publicDir = __dirname + "/public/";

var app = express();

var changed = [];

var users = [];

app.use(function(err, req, res, next) {
	console.log(error.stack);
	res.status(500).send("Something broke! xd");
});

//app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.sendFile(publicDir + "index.html");
});

app.get('/index.html', function(req, res) {
	res.sendFile(publicDir + "index.html");
});

app.get('/game.html', function(req, res) {
	res.sendFile(publicDir + "game.html");
});

app.get('/jquery.js', function(req, res) {
	res.sendFile(publicDir + "jquery.js");
});

app.get('/socket.io.js', function(req, res) {
	res.sendFile(publicDir + "socket.io.js");
});

app.get('/socket.js', function(req, res) {
	res.sendFile(publicDir + "socket.js");
});

app.get('/reload-client.js', function(req, res) {
	res.sendFile(publicDir + "reload-client.js");
});

app.get('/game-client.js', function(req, res) {
	res.sendFile(publicDir + "game-client.js");
});

app.get('/fpsmeter.js', function(req, res) {
	res.sendFile(publicDir + "fpsmeter.js");
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

server.listen(port, function() {});