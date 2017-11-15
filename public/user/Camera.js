var Camera = function(canvas, fitByMax) {
	this.canvas = canvas;
	this.fitByMax = fitByMax;
	
	this.width = 0;
	this.height = 0;
	this.max = 0;
	this.min = 0;
	
	this.viewWidth = 0;
	this.viewHeight = 0;
	this.viewRatio = 0;
	this.viewMax = 0;
	this.viewMin = 0;
	
	this.adjustSize = function() {
		// Two styles: The first when true is like how agar.io does it. The second is like how a movie with a fixed aspect ratio does it.
		if (this.fitByMax === true) {
			this.canvas.width = this.canvas.parentElement.clientWidth;
			this.canvas.height = this.canvas.parentElement.clientHeight;
			this.canvas.style.left = "0px";
			this.canvas.style.top = "0px";
		}
		else {
			var width = this.canvas.parentElement.clientWidth;
			var height = this.canvas.parentElement.clientHeight;
			
			if (this.viewRatio > 1.0) {
				var sizingFrom = height * this.viewRatio < width ? height : height - (height * this.viewRatio - width) / 2.0;
				
				this.canvas.width = sizingFrom * this.viewRatio;
				this.canvas.height = sizingFrom;
				this.canvas.style.left = "" + (this.canvas.parentElement.clientWidth / 2 - this.canvas.width / 2) + "px";
				this.canvas.style.top = "" + (this.canvas.parentElement.clientHeight / 2 - this.canvas.height / 2) + "px";
			}
			else {
				// TODO
				this.canvas.width = this.canvas.parentElement.clientWidth;
				this.canvas.height = this.canvas.parentElement.clientWidth * (1.0 / this.viewRatio);
				this.canvas.style.left = "0px";
				this.canvas.style.top = "" + (this.canvas.parentElement.clientHeight / 2 - this.canvas.height / 2) + "px";
			}
		}
		
		this.width = this.canvas.width;
		this.height = this.canvas.height;
		if (this.width > this.height) {
			this.max = this.width;
			this.min = this.height;
		}
		else {
			this.max = this.height;
			this.min = this.width;
		}
	};
	
	this.setView = function(width, height) {
		this.viewWidth = width;
		this.viewHeight = height;
		this.viewRatio = this.viewWidth / this.viewHeight;
		if (this.viewWidth > this.viewHeight) {
			this.viewMax = this.viewWidth;
			this.viewMin = this.viewHeight;
		}
		else {
			this.viewMax = this.viewHeight;
			this.viewMin = this.viewWidth;
		}
	};
};