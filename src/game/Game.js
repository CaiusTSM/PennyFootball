var uuid = require("uuid/v4");

var time = require("./time.js");
var planck = require("./planck.js");

// Here there would be like Coin object and stuff and Game would have a list of them
// Also a Wall object for the bounds of the game's arena.

/*
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
*/

/*
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
*/

var Wall = function(world, position, width, height) {
	this.id = uuid();
	
	this.bodyDef = {};
	
	this.width = width;
	this.height = height;
	this.shape = planck.Box(this.width / 2.0, this.height / 2.0);
	
	this.fixDef = {
		density: 1.0,
		friction: 0.5,
		restitution: 0.2
	};
	
	this.body = world.createBody(this.bodyDef);
	this.body.setPosition(position);
	
	this.fixture = this.body.createFixture(this.shape, this.fixDef);
};

var Coin = function(world, radius, density, position) {
	this.id = uuid();
	
	// Normally this would contain like velocity dampening and stuff (especially for pennies so they slow down over time / simulate friction on the table)
	// But I left it blank for this box demo since we don't need any of that stuff for it
	this.bodyDef = {
		linearDamping : 0.5,
		angularDamping : 0.5
	};
	
	this.radius = radius;
	this.shape = planck.Circle(this.radius);
	
	this.fixDef = {
		density: density,
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
	/*
	this.ground = null;
	this.boxes = [];
	*/
	this.walls = [];
	this.coins = [];
	
	this.inputQueue = [];
	
	this.initialized = false;
	
	this.tickCount = 0;
	
	this.init = function() {
		this.timer = new time.Timer();
		this.timestep = 1.0 / 50.0;
		this.timePassed = 0;
		this.hostTickRate = 1.0 / 10.0;
		this.packetTimePassed = 0;
		
		this.world = new planck.World(planck.Vec2(0.0, 0.0), true);
		/*
		this.ground = new Ground(this.world);
		this.boxes = [];
		
		for (var k = 0; k < 3; ++k) {
			for (var i = 0; i < 20; ++i) {
				this.boxes.push(new Box(this.world, planck.Vec2(9.5 + 0.1 + i * 1.04, i - 5 - 15 * k)));
			}
		}
		*/
		this.setup();
		
		this.initialized = true;
	};
	
	this.start = function() {
		if (this.initialized === true) {
			this.timer.start();
			//requestAnimationFrame(this.loop);
			//setInterval(this.loop, 2);
			setTimeout(this.loop, 1);
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
			
			/*
			if (this.tickCount % 200 === 0) {
				this.boxes.push(new Box(this.world, planck.Vec2(15.0 + this.tickCount % 11, 1.0)));
				this.world.destroyBody(this.boxes[0].body);
				this.boxes.splice(0, 1);
			}
			*/
		}
		
		this.packetTimePassed += Math.min(1, dt);
		
		// Send packet to other players
		if (this.packetTimePassed >= this.hostTickRate) {
			this.packetTimePassed = 0.0;
			process.send(this.createPacket());
		}
		
		setTimeout(this.loop, 1);
	}.bind(this);
	// This bind thing is so "this" still points to the right thing when using requestAnimationFrame or setInterval
	
	// Game logic goes here
	this.tick = function(dt) {
		for (var i = 0; i < this.inputQueue.length; ++i) {
			var input = this.inputQueue[i].input;
			
			var id = input.id;
			var strength = input.strength;
			var angle = input.angle;
			
			for (var i = 0; i < this.coins.length; ++i) {
				var coin = this.coins[i];
				
				if (coin.id === id && i === 0) {
					coin.body.applyLinearImpulse(planck.Vec2(strength * 30.0 * Math.cos(angle), -strength * 30.0 * Math.sin(angle)), coin.body.getWorldPoint(coin.body.getPosition()), true);
					break;
				}
			}
		}
		
		this.inputQueue = [];
		
		this.world.step(this.timestep);
	};
	
	this.setup = function() {
		this.walls = [];
		
		// Left backplate
		this.walls.push(new Wall(this.world, planck.Vec2(-0.4, 7.5 / 2.0 + 5.0 + 2.5 / 2.0), 1.0, 5.0));
		
		// Right backplate
		this.walls.push(new Wall(this.world, planck.Vec2(40.4, 7.5 / 2.0 + 5.0 + 2.5 / 2.0), 1.0, 5.0));
		
		// Top left
		this.walls.push(new Wall(this.world, planck.Vec2(0.5, 7.5 / 2.0), 1.0, 7.5));
		
		// Bottom left
		this.walls.push(new Wall(this.world, planck.Vec2(0.5, 7.5 / 2.0 + 7.5 + 5.0), 1.0, 7.5));
		
		// Top right
		this.walls.push(new Wall(this.world, planck.Vec2(39.5, 7.5 / 2.0), 1.0, 7.5));
		
		// Bottom right
		this.walls.push(new Wall(this.world, planck.Vec2(39.5, 7.5 / 2.0 + 7.5 + 5.0), 1.0, 7.5));
		
		// Top
		this.walls.push(new Wall(this.world, planck.Vec2(20.0, 0.5), 40.0, 1.0));
		
		// Bottom
		this.walls.push(new Wall(this.world, planck.Vec2(20.0, 19.5), 40.0, 1.0));
		
		// Top pillar
		this.walls.push(new Wall(this.world, planck.Vec2(20.0, 2.5), 1.0, 5.0));
		
		// Bottom pillar
		this.walls.push(new Wall(this.world, planck.Vec2(20.0, 17.5), 1.0, 5.0));
		
		this.coins = [];
		
		// The soccer ball
		this.coins.push(new Coin(this.world, 0.5, 3.0, planck.Vec2(20.0, 9.0)));
		
		// Team 1
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(15.0, 5.0)));
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(15.0, 9.0)));
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(15.0, 13.0)));
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(17.0, 7.0)));
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(17.0, 11.0)));
		
		// Goal keeper 1
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(2.0, 7.5 / 2.0 + 5.0 + 2.5 / 2.0)));
		
		// Team 2
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(25.0, 5.0)));
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(25.0, 9.0)));
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(25.0, 13.0)));
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(23.0, 7.0)));
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(23.0, 11.0)));
		
		// Goal keeper 2
		this.coins.push(new Coin(this.world, 1.0, 1.0, planck.Vec2(38.0, 7.5 / 2.0 + 5.0 + 2.5 / 2.0)));
	};
	
	this.pushInput = function(input) {
		this.inputQueue.push({ input: input });
	};
	
	this.createPacket = function() {
		/*
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
		*/
		
		var walls = [];
		
		for (var i = 0; i < this.walls.length; ++i) {
			var wall = this.walls[i];
			
			var position = wall.body.getPosition();
			
			walls.push({
				id: wall.id,
				width: wall.width,
				height: wall.height,
				position: position,
				renderX: position.x,
				renderY: position.y
			});
		}
		
		var coins = [];
		
		for (var i = 0; i < this.coins.length; ++i) {
			var coin = this.coins[i];
			
			var position = coin.body.getPosition();
			var angle = coin.body.getAngle();
			
			coins.push({
				id: coin.id,
				radius: coin.radius,
				position: position,
				angle: angle,
				renderX: position.x,
				renderY: position.y
			});
		}
		
		return {
			time: this.tickCount,
			walls: walls,
			coins: coins
		};
	}.bind(this);
};

module.exports = Game;