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

module.exports = {
	timestamp: timestamp,
	Timer: Timer
};