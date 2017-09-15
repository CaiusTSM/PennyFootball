var name = "";
var users = [];

var canvas = null;
var ctx = null;

var canvasWidth = 0;
var canvasHeight = 0;
var canvasMax = 0;

var viewWidth = 0;
var viewHeight = 0;
var viewMax = 0;

var timer = null;
var timeStep = 0;
var timePassed = 0;

var boardWidth = 0;
var boardHeight = 0;

var coins = [];

var fpsmeter = null;

var mouseCoin = null;

var mousePos = {
	x: 0,
	y: 0
};
var prevMousePos = {
	x: 0,
	y: 0
};

function getMousePos(evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: Math.round((evt.clientX - rect.left)/(rect.right-rect.left)*canvasWidth),
		y: Math.round((evt.clientY - rect.top)/(rect.bottom-rect.top)*canvasHeight)
	};
}

function timestamp() {
	return window.performance && window.performance.now ? window.performance.now() : new Date().getTime()
}

function Timer() {
	var startTime = 0;
	var endTime = 0;
	
	this.start = function() {
		startTime = timestamp();
	};
	
	this.elapsed = function() {
		endTime = timestamp();
		var timeDiff = endTime - startTime;
		return timeDiff;
	};
}

function Coin() {
	var x = 0.0;
	var y = 0.0;
	var vx = 0.0;
	var vy = 0.0;
	var ax = 0.0;
	var ay = 0.0;
	var r = 0.5;
	
	return {
		x: x,
		y: y,
		vx: vx,
		vy: vy,
		ax: ax,
		ay: ay,
		r: r
	};
}

function coin_clone(coin) {
	return {
		x: coin.x,
		y: coin.y,
		vx: coin.vx,
		vy: coin.vy,
		ax: coin.ax,
		ay: coin.ay,
		r: coin.r
	};
}

function Collision() {
	var indexA = 0;
	var indexB = 0;
	var dx = 0;
	var dy = 0;
	var mag = 0;
	var combinedRadii = 0;
	
	return {
		indexA: indexA,
		indexB: indexB,
		dx: dx,
		dy: dy,
		mag: mag,
		combinedRadii: combinedRadii
	};
}

function renderCoins() {
	var canvasViewRatio = canvasMax / viewMax;
	
	for (var i = 0; i < coins.length; ++i) {
		var coin = coins[i];
		
		ctx.fillStyle = "#AA00AA";
		ctx.strokeStyle = "#006600";
		ctx.lineWidth = 4;
		
		ctx.beginPath();
		ctx.arc(coin.x * canvasViewRatio, coin.y * canvasViewRatio, coin.r * canvasViewRatio - 2, 0, 2 * Math.PI, false);
		ctx.fill();
		ctx.stroke();
	}
}

function stepCoinPhysics(timeStep) {
	for (var i = 0; i < coins.length; ++i) {
		var coin = coins[i];
		// Integrate
		coin.vx += coin.ax;
		coin.vy += coin.ay;
		coin.x += coin.vx * timeStep;
		coin.y += coin.vy * timeStep;
	}
	
	var collisions = [];
	// Check collisions between circles
	for (var i = 0; i < coins.length; ++i) {
		var coin = coins[i];
		// Check collision with other coins
		for (var j = 0; j < coins.length; ++j) {
			var otherCoin = coins[j];
			if (j != i) {
				// Collision normal creation
				var dx = otherCoin.x - coin.x;
				var dy = otherCoin.y - coin.y;
				var mag = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
				
				var combinedRadii = coin.r + otherCoin.r;
				
				if (mag < combinedRadii) {
					var collision = new Collision();
					
					collision.indexA = i;
					collision.indexB = j;
					collision.dx = dx;
					collision.dy = dy;
					collision.mag = mag;
					collision.combinedRadii = combinedRadii;
					
					collisions.push(collision);
				}
			}
		}
	}
	
	var newCoinValues = [];
	for (var i = 0; i < collisions.length; ++i) {
		var collision = collisions[i];
		var coinX = coins[collision.indexA].x;
		var coinY = coins[collision.indexA].y;
		var coinVX = coins[collision.indexA].vx;
		var coinVY = coins[collision.indexA].vy;
		var otherCoinX = coins[collision.indexB].x;
		var otherCoinY = coins[collision.indexB].y;
		var otherCoinVX = coins[collision.indexB].vx;
		var otherCoinVY = coins[collision.indexB].vy;
		
		var dxn = collision.dx / collision.mag;
		var dyn = collision.dy / collision.mag;
		
		// Relative velocity
		var dvx = otherCoinVX - coinVX;
		var dvy = otherCoinVY - coinVY;
		
		// Dot product of relative velocity and normal
		var rvAlongNormal = dvx * dxn + dvy * dyn;
		
		if (rvAlongNormal > 0) { continue; }
		
		var impulse = -rvAlongNormal;
		// Dot product of velocity and normal
		//var impulse = coin.vx * dxn + coin.vy * dyn - otherCoin.vx * dxn - otherCoin.vy * dyn;
		
		newCoinValues.push(
			{
				index: collision.indexA,
				vx: coin.vx - impulse * dxn,
				vy: coin.vy - impulse * xyn
			}
		);
		
		coin.vx -= impulse * dxn;
		coin.vy -= impulse * dyn;
		otherCoin.vx += impulse * dxn;
		otherCoin.vy += impulse * dyn;
		
		// Positional correction to fix floatng point round-off error
		var penetrationDepth = Math.max(collision.combinedRadii - collision.mag, 0);
		var percent = 0.2;
		var slop = 0.01;
		var correctionX = dxn * Math.max(penetrationDepth - slop, 0) * percent;
		var correctionY = dyn * Math.max(penetrationDepth - slop, 0) * percent;
		coin.x -= correctionX;
		coin.y -= correctionY;
		otherCoin.x += correctionX;
		otherCoin.y += correctionY;
	}
	
	for (var i = 0; i < coins.length; ++i) {
		var coin = coins[i];
		// Check collision with walls
		if (coin.x - coin.r < 0) {
			coin.x = coin.r;
			coin.vx = -coin.vx;
		}
		else if (coin.x + coin.r > boardWidth) {
			coin.x = boardWidth - coin.r;
			coin.vx = -coin.vx;
		}
		
		if (coin.y - coin.r < 0) {
			coin.y = coin.r;
			coin.vy = -coin.vy;
		}
		else if (coin.y + coin.r > boardHeight) {
			coin.y = boardHeight - coin.r;
			coin.vy = -coin.vy * 0.8;
		}
	}
}

function tick(timeStep) {
	mouseCoin.x = mousePos.x;
	mouseCoin.y = mousePos.y;
	mouseCoin.vx = mousePos.x - prevMousePos.x;
	mouseCoin.vy = mousePos.y - prevMousePos.y;
	mouseCoin.ax = 0;
	mouseCoin.ay = 0;
	mouseCoin.r = 0.15;
	
	stepCoinPhysics(timeStep);
	
	mouseCoin.x = mousePos.x;
	mouseCoin.y = mousePos.y;
	mouseCoin.vx = mousePos.x - prevMousePos.x;
	mouseCoin.vy = mousePos.y - prevMousePos.y;
	mouseCoin.ax = 0;
	mouseCoin.ay = 0;
	mouseCoin.r = 0.15;
}

function render() {
	ctx.beginPath();
	renderCoins();
}

function loop() {
	fpsmeter.tickStart();
	
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	canvasWidth = canvas.width;
	canvasHeight = canvas.height;
	if (canvasWidth > canvasHeight) {
		canvasMax = canvasWidth;
	}
	else {
		canvasMax = canvasHeight;
	}
	
	var timeDiff = timer.elapsed() / 1000.0;
	timer.start();
	timePassed += Math.min(1, timeDiff);
	
	while (timePassed >= timeStep) {
		timePassed -= timeStep;
		tick(timeStep);
	}
	
	ctx.fillStyle = "#001111";
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);
	
	blockWidth = canvasMax / viewWidth;
	blockHeight = canvasMax / viewHeight;
	ctx.fillStyle = "#002222";
	for (var y = 0; y < viewWidth; ++y) {
		for (var x = 0; x < viewHeight; ++x) {
			if (y % 2 == 0) {
				if (x % 2 == 0) {
					ctx.fillRect(x * blockWidth, y * blockHeight, blockWidth, blockHeight);
				}
			}
			else {
				if (x % 2 != 0) {
					ctx.fillRect(x * blockWidth, y * blockHeight, blockWidth, blockHeight);
				}
			}
		}
	}
	
	render(timeDiff);
	
	fpsmeter.tick();
	requestAnimationFrame(loop);
}

function game_init() {
	canvas = document.getElementById("canvas_game");
	ctx = canvas.getContext("2d");
	
	viewWidth = 20;
	viewHeight = 20;
	if (viewWidth > viewHeight) {
		viewMax = viewWidth;
	}
	else {
		viewMax = viewHeight;
	}
	
	timer = new Timer();
	timeStep = 1.0 / 60.0;
	timePassed = 0;
	
	boardWidth = 10;
	boardHeight = 10;
	
	coins = [];
	for (var i = 0; i < 200; ++i) {
		var coin = new Coin();
		coin.x = Math.random() * boardWidth;
		coin.y = Math.random() * boardHeight;
		coin.vx = Math.random() * boardWidth / 4.0 - Math.random() * boardWidth / 4.0;
		coin.vy = 0.0;
		coin.ay = 0.05;
		coin.r = 0.15
		coins.push(coin);
	}
	
	fpsmeter = new FPSMeter({decimals: 0, graph: true, theme: "dark", left: "5px"});
	
	mouseCoin = new Coin();
	
	mouseCoin.x = 0;
	mouseCoin.y = 0;
	mouseCoin.vx = 0;
	mouseCoin.vy = 0;
	mouseCoin.ax = 0;
	mouseCoin.ay = 0;
	mouseCoin.r = 0.15;
	
	coins.push(mouseCoin);
	
	canvas.addEventListener('mousemove', function(evt) {
		prevMousePos = mousePos;
		mousePos = getMousePos(evt);
		mousePos.x = mousePos.x / canvasMax * viewMax;
		mousePos.y = mousePos.y / canvasMax * viewMax;
	});
	
	
	timer.start();
	requestAnimationFrame(loop);
}

function lobby_add() {
	$(document.body).append('<div id="div_lobby" style="position:absolute;width:200px;min-height:400px;max-height:100%;background:grey;left:5px;top:70px;border-radius:15px;color:#222222;"><p style="text-align:center;">Lobby</p><br></div>');
}

function lobby_render() {
	$("#div_lobby").empty();
	$("#div_lobby").append('<p style="text-align:center;">Lobby</p><br>');
	for (var i = 0; i < users.length; ++i) {
		var user = users[i];
		$("#div_lobby").append('<p style="text-align:center;">' + user + '</p>');
	}
}

$(document).ready(function() {
	document.getElementById("button_name").addEventListener("click", function() {
		name = document.getElementById("text_name").value;
		if (name !== "" && name.length < 20) {
			lobby_add();
			
			window.socket.emit("join", { name: name });
			
			window.socket.on("join success", function(data) {
				window.socket.on("joined", function(data) {
					console.log(data.name + " joined.");
					if (users.includes(data.name) == false) {
						users.push(data.name);
					}
					lobby_render();
				});
				
				window.socket.on("parted", function(data) {
					console.log(data.name + " parted.");
					if (users.includes(data.name) == true) {
						users.splice(users.indexOf(data.name), 1);
					}
					lobby_render();
				});
				
				users = data.users;
				lobby_render();
				
				$("#div_enter").remove();
				$(document.body).append('<canvas id="canvas_game"></canvas>');
				
				game_init();
			});
		}
	});
});