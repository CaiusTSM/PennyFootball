var Validator = function() {
	this.alphanum = function(str) {
		var letterNumber = /^[0-9a-zA-Z]+$/;
		
		if (str.match(letterNumber)) {
			return true;
		}
		
		return false;
	
	}
	
	this.validUsername = function(str) {
		if (str.length >= 8 && str.length <= 20 && this.alphanum(str)) {
			return true;
		}
		
		return false;
	}
	
	this.validPassword = function(str) {
		if (str.length >= 8 && str.length <= 20 && this.alphanum(str)) {
			return true;
		}
		
		return false;
	}
}

module.exports = Validator;