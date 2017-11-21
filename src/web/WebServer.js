var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var bodyParser = require('body-parser');
var sessions = require("client-sessions");
var mysql = require('mysql');

var GameServer = require('../game/GameServer.js');

var Database = require('./Database.js');
var Validator = require('./Validator.js');
var Registrar = require('./Registrar.js');
var Authenticator = require('./Authenticator.js');
var Lobby = require('./Lobby.js');

var uuid = require("uuid/v4");

var WebServer = function() {
	this.IP = "0.0.0.0";
	this.PORT = 8080;
	this.publicDir = "";
	
	this.app = null;
	
	this.database = null;
	this.validator = null;
	this.registrar = null;
	this.authenticator = null;
	
	this.server = null;
	
	this.io = null
	
	this.gameServer = null;
	
	this.lobby = null;
	
	this.initialized = false;
	
	this.init = function(IP, PORT, publicDir) {
		if (this.initialized === true) {
			console.log("Error: Server is already initialized.");
			return;
		}
		
		this.IP = IP;
		this.PORT = PORT;
		this.publicDir = publicDir;
		
		this.app = express();
	
		this.app.use(bodyParser.urlencoded({ extended: false }));
		this.app.use(bodyParser.json());
		
		this.app.use(this.onError);
		
		this.app.use(sessions({
			cookieName: 'session',
			secret: uuid(),
			duration: 24 * 60 * 60 * 1000,
			activeDuration: 1000 * 60 * 5
		}));
		
		this.database = new Database("localhost", "root", "");
		
		this.database.connect(
		function() {
			console.log("Database is ready...");
		},
		function(err) {
			console.log("Error: Failed to connect to database.");
			console.log(err);
		});
		
		this.validator = new Validator();
		this.registrar = new Registrar(this.app, this.database, this.validator);
		this.authenticator = new Authenticator(this.app, this.database, this.validator);
		
		this.server = http.createServer(this.app);
		
		this.io = socketio(this.server);
		
		this.gameServer = new GameServer(this.io);
		
		this.lobby = new Lobby(this.app, this.database, this.validator, this.gameServer);
		
		this.app.get("/user/*", this.onUserFile);
		this.app.get("/*", this.onFile);
		
		this.initialized = true;
	}.bind(this);
	
	this.start = function() {
		if (this.initialized === false) {
			console.log("Error: Server is not initialized.");
			return;
		}
		
		this.server.listen(this.PORT, this.IP, this.onStart);
	}.bind(this);
	
	// Callbacks below
	
	this.onError = function(err, req, res, next) {
		console.log(err.stack);
		res.status(500).send("Something broke! xd");
	}.bind(this);
	
	this.onStart = function() {
		console.log("Server is running...");
	}.bind(this);
	
	this.onUserFile = function(req, res) {
		console.log("GET " + req.url);
		
		if (this.authenticator.authenticated(req)) {
			res.status(200);
			res.sendFile(this.publicDir + req.path);
		}
		else {
			res.status(401);
			res.send("Access Denied.");
		}
	}.bind(this);
	
	this.onFile = function(req, res) {
		console.log("GET " + req.url);
		
		res.sendFile(this.publicDir + req.path);
	}.bind(this);
};

module.exports = WebServer;