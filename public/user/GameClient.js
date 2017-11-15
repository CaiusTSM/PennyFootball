// Gets number of miliseconds passed since 199X (idr)
function timestamp() {
	return new Date().getTime();
}

// Object that makes getting time passed easy (like a stopwatch)
var Timer = function() {
	this.startTime = 0;
	this.endTime = 0;
	
	// Calling start again will reset the timer so this function is both start/restart
	this.start = function() {
		this.startTime = timestamp();
	};
	
	// Gives number of miliseconds since start was last called
	this.elapsed = function() {
		this.endTime = timestamp();
		var timeDiff = this.endTime - this.startTime;
		return timeDiff;
	};
};

function lerp(start, end, percent) {
	return (start + percent * (end - start));
}

var GameClient = function(socket, camera, ctx) {
	this.socket = socket;
	this.camera = camera;
	this.ctx = ctx;
	
	this.gameId = "";
	this.inRoom = false;
	this.loopId = -1;
	
	this.stateBuffer = [];
	
	this.timestep = 1.0 / 50.0;
	this.timePassed = 0.0;
	this.timer = new Timer();
	
	this.onJoin = function() {
		console.log("Joined");
		this.inRoom = true;
		this.camera.setView(40, 20);
		requestAnimationFrame(this.loop);
	}.bind(this);
	
	this.onState = function(data) {
		if (this.stateBuffer.length < 10) {
			this.stateBuffer.splice(0, 0, data);
		}
		else {
			this.socket.disconnect();
			
			this.stateBuffer = [];
		}
		console.log(this.stateBuffer.length);
	}.bind(this);
	
	this.join = function(gameId) {
		this.gameId = gameId;
		
		socket.emit("join", { gameId: gameId });
	};
	
	this.loop = function() {
		this.camera.adjustSize();
		
		var dt = this.timer.elapsed() / 1000.0;
		this.timer.start();
		
		if (this.stateBuffer.length >= 2) {
			this.timePassed += Math.min(1, dt);
		
			var targetState = this.stateBuffer[this.stateBuffer.length - 2];
			var currentState = this.stateBuffer[this.stateBuffer.length - 1];
			
			var timeBetweenStates = Math.abs(targetState.time - currentState.time) * this.timestep;
			if (this.stateBuffer.length > 5) {
				timeBetweenStates = Math.abs(targetState.time - currentState.time) * this.timestep * 0.5;
			}
			
			var percent = this.timePassed / timeBetweenStates;
			
			if (percent >= 1.0) {
				percent = 0.0;
				
				while (this.timePassed >= this.timestep) {
					this.timePassed -= this.timestep;
				}
				
				if (this.stateBuffer.length > 2) {
					this.stateBuffer.splice(this.stateBuffer.length - 1, 1);
				}
			}
			
			this.interpolate(currentState, targetState, percent);
		}
			
		// render at non-fixed timestep (as fast as this loop runs)
		if (this.camera.fitByMax === true) {
			this.render(this.ctx, this.camera.max / this.camera.viewMax);
		}
		else {
			this.render(this.ctx, this.camera.min / this.camera.viewMin);
		}
		
		requestAnimationFrame(this.loop);
	}.bind(this);
	
	this.interpolate = function(currentState, targetState, percent) {
		for (var i = 0; i < currentState.boxes.length; ++i) {
			var box = currentState.boxes[i];
			
			for (var j = 0; j < targetState.boxes.length; ++j) {
				var targetBox = targetState.boxes[i];
				
				if (box.id === targetBox.id) {
					box.renderX = lerp(box.position.x, targetBox.position.x, percent);
					box.renderY = lerp(box.position.y, targetBox.position.y, percent);
				}
			}
		}
	};
	
	this.render = function(ctx, scale) {
		if (this.stateBuffer.length > 0) {
			for (var i = 0; i < this.stateBuffer[this.stateBuffer.length - 1].boxes.length; ++i) {
				var box = this.stateBuffer[this.stateBuffer.length - 1].boxes[i];
				
				// Fill color (not border color)
				ctx.fillStyle = "#aaaaaa";
				
				// Push transformation matrix
				ctx.save();
				
				// Apply transformations (each transform is a matrix and every time you apply a transform is does matrix multiplication (this is hidden from the api user)) and then draw the box
				// IMPORTANT: The order in which transformations are applied is crucial
				// Multiply by scale to convert from meters to pixels
				ctx.translate(box.renderX * scale, box.renderY * scale);
				ctx.rotate(box.angle);
				// Multiply by scale to convert from meters to pixels
				ctx.scale(scale, scale);
				ctx.fillRect(-box.width / 2.0, -box.height / 2.0, box.width, box.height);
				
				// Pop transformation matrix
				ctx.restore();
			}
		}
	};
	
	this.socket.on("state", this.onState);
	this.socket.on("joined", this.onJoin);
};