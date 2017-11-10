$(document).ready(function() {
	window.socket.on("file changed", function(data) {
		if (data !== null && data !== undefined && "changedList" in data) {
			var changedList = data.changedList;
			for (var i = 0; i < changedList.length; ++i) {
				var file = changedList[i];
				
				if (file.includes(window.location.pathname) || (file === "index.html" && window.location.pathname === "/") || document.head.innerHTML.includes(file)) {
					var xhttp = new XMLHttpRequest();
					
					xhttp.onreadystatechange = function() {
						if (this.readyState == 4 && this.status == 200) {
							document.documentElement.innerHTML = xhttp.responseText;
						}
					};
					
					xhttp.open("GET", window.location.pathname, true);
					xhttp.send();
				}
			}
		}
	});
});