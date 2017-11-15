var uuid = require("uuid/v4");

var time = require("./time.js");
var planck = require("./planck.js");


// Game object for physics demo
var Ground = function(world) {
	this.bodyDef = {};
	
	this.width = 30;
	this.height = 1;
	this.shape = planck.Box(this.width / 2.0, this.height / 2.0);
	
	this.fixDef = {
		density: 1.0,
		friction: 0.5,
		restitution: 0.2
	};
	
	this.body = world.createBody(this.bodyDef);
	this.body.setPosition(planck.Vec2(5 + this.width / 2.0, 19));
	
	this.fixture = this.body.createFixture(this.shape, this.fixDef);
};

// Game object for physics demo
var Box = function(world, position) {
	this.id = uuid();
	
	// Normally this would contain like velocity dampening and stuff (especially for pennies so they slow down over time / simulate friction on the table)
	// But I left it blank for this box demo since we don't need any of that stuff for it
	this.bodyDef = {};
	
	this.width = 1;
	this.height = 1;
	this.shape = planck.Box(this.width / 2.0, this.height / 2.0);
	
	this.fixDef = {
		density: 1.0,
		friction: 0.5,
		restitution: 0.2
	};
	
	this.body = world.createDynamicBody(this.bodyDef);
	this.body.setPosition(position);
	
	this.fixture = this.body.createFixture(this.shape, this.fixDef);
};

// Core game object
var Game = function() {
	this.timer = null;
	this.timestep = 1.0 / 50.0;
	this.timePassed = 0;
	this.hostTickRate = 1.0 / 10.0;
	this.packetTimePassed = 0;
	
	this.world = null;
	this.ground = null;
	this.boxes = [];
	
	this.inputQueue = [];
	
	this.initialized = false;
	
	this.tickCount = 0;
	
	this.init = function() {
		this.timer = new time.Timer();
		this.timestep = 1.0 / 50.0;
		this.timePassed = 0;
		this.hostTickRate = 1.0 / 10.0;
		this.packetTimePassed = 0;
		
		this.world = new planck.World(planck.Vec2(0.0, 10.0), true);
		this.ground = new Ground(this.world);
		this.boxes = [];
		
		for (var k = 0; k < 5; ++k) {
			for (var i = 0; i < 20; ++i) {
				this.boxes.push(new Box(this.world, planck.Vec2(9.5 + 0.1 + i * 1.04, i - 5 - 15 * k)));
			}
		}
		
		this.initialized = true;
	};
	
	this.start = function() {
		if (this.initialized === true) {
			this.timer.start();
			// Web browser function used for 60fps stuff like animations and games (relativly new)
			//requestAnimationFrame(this.loop);
			//setInterval(this.loop, 2);
			setTimeout(this.loop, 0);
		}
		else {
			console.log("Error: Started game without initialization.");
		}
	};
	
	this.loop = function() {
		// Compute time passed (how long did 1 loop take?), restart timer
		var dt = this.timer.elapsed() / 1000.0;
		this.timer.start();
		
		this.timePassed += Math.min(1, dt);
		
		// tick at fixed timestep
		while (this.timePassed >= this.timestep) {
			this.timePassed -= this.timestep;
			this.tick(this.timestep);
			this.tickCount += 1;
			
			if (this.tickCount % 200 === 0) {
				this.boxes.push(new Box(this.world, planck.Vec2(15.0 + this.tickCount % 11, 1.0)));
				this.world.destroyBody(this.boxes[0].body);
				this.boxes.splice(0, 1);
			}
		}
		
		this.packetTimePassed += Math.min(1, dt);
		
		// Send packet to other players
		if (this.packetTimePassed >= this.hostTickRate) {
			this.packetTimePassed = 0.0;
			process.send(this.createPacket());
		}
		
		setTimeout(this.loop, 0);
	}.bind(this);
	// This bind thing is so "this" still points to the right thing when using requestAnimationFrame or setInterval
	
	// Game logic goes here
	this.tick = function(dt) {
		// TODO apply queued inputs in order and other stuff
		
		this.world.step(this.timestep);
	};
	
	this.pushInput = function(gameClient, input) {
		this.inputQueue.push({ client: gameClient, input: input });
	};
	
	this.createPacket = function() {
		var boxes = [];
		
		for (var i = 0; i < this.boxes.length; ++i) {
			var box = this.boxes[i];
			
			var position = box.body.getPosition();
			
			boxes.push({
				id: box.id,
				width: box.width,
				height: box.height,
				position: box.body.getPosition(),
				angle: box.body.getAngle(),
				renderX: position.x,
				renderY: position.y
			});
		}
		
		return {
			time: this.tickCount,
			boxes: boxes
		};
	}.bind(this);
};

module.exports = Game;