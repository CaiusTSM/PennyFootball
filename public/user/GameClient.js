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
	
	this.scale = 1.0;
	
	this.mouseX = 0.0;
	this.mouseY = 0.0;
	this.mouseWasDown = false;
	this.mouseDown = false;
	
	this.makingMove = false;
	this.moveStartX = 0.0;
	this.moveStartY = 0.0;
	this.moveEndX = 0.0;
	this.moveEndY = 0.0;
	this.moveId = 0;
	this.moveStrength = 0.0;
	this.moveAngle = 0.0;
	
	this.onJoin = function() {
		console.log("Joined");
		this.inRoom = true;
		this.camera.setView(40, 20);
		requestAnimationFrame(this.loop);
	}.bind(this);
	
	this.onState = function(data) {
		if (this.stateBuffer.length < 20) {
			this.stateBuffer.splice(0, 0, data);
		}
		else {
			this.stateBuffer.splice(5, 5);
		}
	}.bind(this);
	
	this.onGameOver = function(data) {
		window.location.href = "/user/home.html";
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
			
			if (this.stateBuffer.length > 10) {
				timeBetweenStates = Math.abs(targetState.time - currentState.time) * this.timestep * 0.05;
			}
			else if (this.stateBuffer.length > 5) {
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
			this.scale = this.camera.max / this.camera.viewMax;
		}
		else {
			this.scale = this.camera.min / this.camera.viewMin;
		}
		
		this.render(this.ctx, this.scale);
		
		requestAnimationFrame(this.loop);
	}.bind(this);
	
	this.interpolate = function(currentState, targetState, percent) {
		/*
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
		*/
		
		for (var i = 0; i < currentState.coins.length; ++i) {
			var coin = currentState.coins[i];
			
			for (var j = 0; j < targetState.coins.length; ++j) {
				var targetCoin = targetState.coins[i];
				
				if (coin.id === targetCoin.id) {
					coin.renderX = lerp(coin.position.x, targetCoin.position.x, percent);
					coin.renderY = lerp(coin.position.y, targetCoin.position.y, percent);
				}
			}
		}
	};
	
	this.render = function(ctx, scale) {
		ctx.fillStyle = "#222222";
		ctx.fillRect(0, 0, this.camera.canvas.width, this.camera.canvas.height);
		
		if (this.stateBuffer.length > 0) {
			/*
			for (var i = 0; i < this.stateBuffer[this.stateBuffer.length - 1].boxes.length; ++i) {
				var box = this.stateBuffer[this.stateBuffer.length - 1].boxes[i];
				
				// Fill color (not border color)
				ctx.fillStyle = "#aaaaaa";
				
				// Border width
				ctx.lineWidth = 1;
				
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
			*/
			
			for (var i = 0; i < this.stateBuffer[this.stateBuffer.length - 1].coins.length; ++i) {
				var coin = this.stateBuffer[this.stateBuffer.length - 1].coins[i];
				
				// Fill color (not border color)
				if (i === 0) {
					ctx.fillStyle = "#CC1111";
				}
				else {
					ctx.fillStyle = "#aaaaaa";
				}
				
				// Border width
				ctx.lineWidth = 1;
				
				// Push transformation matrix
				ctx.save();
				
				ctx.translate(coin.renderX * scale, coin.renderY * scale);
				ctx.rotate(coin.angle);
				// Multiply by scale to convert from meters to pixels
				ctx.scale(scale, scale);
				
				ctx.beginPath();
				ctx.arc(0, 0, coin.radius, 0, Math.PI * 2.0, false);
				
				// Pop transformation matrix
				ctx.restore();
				
				ctx.fill();
			}
			
			for (var i = 0; i < this.stateBuffer[this.stateBuffer.length - 1].walls.length; ++i) {
				var wall = this.stateBuffer[this.stateBuffer.length - 1].walls[i];
				
				// Fill color (not border color)
				ctx.fillStyle = "#aaccaa";
				
				// Border width
				ctx.lineWidth = 1;
				
				// Push transformation matrix
				ctx.save();
				
				ctx.translate(wall.renderX * scale, wall.renderY * scale);
				// Multiply by scale to convert from meters to pixels
				ctx.scale(scale, scale);
				
				ctx.fillRect(-wall.width / 2.0, -wall.height / 2.0, wall.width, wall.height);
				
				// Pop transformation matrix
				ctx.restore();
			}
			
			var state = this.stateBuffer[this.stateBuffer.length - 1];
			
			ctx.fillStyle = "#AA1111";
			ctx.font = "20px Arial";
			ctx.fillText("Score: " + state.scoreA, 10, 30);
			
			ctx.fillStyle = "#5555AA";
			ctx.font = "20px Arial";
			ctx.fillText("Score: " + state.scoreB, 10, 60);
			
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "20px Arial";
			if (state.turn === true) {
				ctx.fillText("Turn: Your Turn", 110, 30);
			}
			else {
				ctx.fillText("Turn: Other Player's Turn", 110, 30);
			}
		}
		
		if (this.mouseDown === true && this.makingMove === true) {
			if (this.moveStrength <= 0.33) {
				ctx.strokeStyle = "#11FF11";
			}
			else if (this.moveStrength <= 0.66) {
				ctx.strokeStyle = "#FFFF11";
			}
			else {
				ctx.strokeStyle = "#FF1111";
			}
			ctx.lineWidth = 2;
			
			ctx.beginPath();
			ctx.moveTo(this.moveStartX, this.moveStartY);
			ctx.lineTo(this.moveEndX, this.moveEndY);
			ctx.stroke();
		}
	};
	
	this.makeMove = function() {
		this.socket.emit("input", { id: this.moveId, strength: this.moveStrength, angle: this.moveAngle });
		console.log("Sent input.");
	};
	
	this.onMouseMove = function(mouseX, mouseY) {
		this.mouseX = mouseX;
		this.mouseY = mouseY;
		
		if (this.mouseDown === true && this.makingMove === true) {
			this.moveEndX = this.mouseX;
			this.moveEndY = this.mouseY;
			
			var dx = this.moveEndX - this.moveStartX;
			var dy = this.moveEndY - this.moveStartY;
			var distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
			
			this.moveStrength = Math.min(distance / (this.camera.min * 0.33), 1.0);
			this.moveAngle = Math.atan2(dy / distance, -dx / distance) + Math.PI;
		}
	}.bind(this);
	
	this.onMouseDown = function(mouseX, mouseY) {
		this.mouseX = mouseX;
		this.mouseY = mouseY;
		
		this.mouseWasDown = this.mouseDown;
		this.mouseDown = true;
		
		if (this.mouseDown === true && this.mouseWasDown === false) {
			this.makingMove = true;
			this.moveStartX = this.mouseX;
			this.moveStartY = this.mouseY;
			this.moveEndX = this.mouseX;
			this.moveEndY = this.mouseY;
			
			if (this.stateBuffer.length >= 2) {
				var state = this.stateBuffer[this.stateBuffer.length - 1];
				var x = this.moveStartX;
				var y = this.moveStartY;
				
				/*
				for (var i = 0; i < state.boxes.length; ++i) {
					var box = state.boxes[i];
					
					if (Math.abs(box.renderX * this.scale - x) <= box.width / 2.0 * this.scale && Math.abs(box.renderY * this.scale - y) <= box.height / 2.0 * this.scale) {
						this.moveId = box.id;
						break;
					}
				}
				*/
				
				for (var i = 0; i < state.coins.length; ++i) {
					var coin = state.coins[i];
					
					if (Math.abs(coin.renderX * this.scale - x) <= coin.radius * this.scale && Math.abs(coin.renderY * this.scale - y) <= coin.radius * this.scale) {
						this.moveId = coin.id;
						break;
					}
				}
			}
			
			var dx = this.moveEndX - this.moveStartX;
			var dy = this.moveEndY - this.moveStartY;
			var distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
			
			this.moveStrength = Math.min(distance / (this.camera.min * 0.33), 1.0);
			this.moveAngle = Math.atan2(dy / distance, -dx / distance) + Math.PI;
		}
	}.bind(this);
	
	this.onMouseUp = function(mouseX, mouseY) {
		this.mouseX = mouseX;
		this.mouseY = mouseY;
		
		this.mouseWasDown = this.mouseDown;
		this.mouseDown = false;
		
		if (this.mouseDown === false && this.mouseWasDown === true) {
			this.makingMove = false;
			this.moveEndX = this.mouseX;
			this.moveEndY = this.mouseY;
			
			var dx = this.moveEndX - this.moveStartX;
			var dy = this.moveEndY - this.moveStartY;
			var distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
			
			this.moveStrength = Math.min(distance / (this.camera.min * 0.33), 1.0);
			this.moveAngle = Math.atan2(dy / distance, -dx / distance) + Math.PI;

			this.makeMove();
		}
	}.bind(this);
	
	this.socket.on("state", this.onState);
	this.socket.on("joined", this.onJoin);
	this.socket.on("game over", this.onGameOver);
};