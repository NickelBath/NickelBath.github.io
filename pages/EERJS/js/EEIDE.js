var EEIDE = function() {
	
	//stuff for the editor
	var editor = ace.edit("jscode");
	editor.setTheme("ace/theme/monokai");
	editor.session.setMode("ace/mode/javascript");
	//editor.getSession().$worker.send("setOptions", [{
	//	maxerr: 10000
	//}]);
	
	let eeide = {};

	// consts
	const redMain = "#FF0000";
	const redFade = "#990000";
	const greenMain = "#00FF00";
	const greenFade = "#FFFFFF";
	
	const buttonConnect = "button-connect";
	const buttonCompile = "button-compile";
	const inputEmail = "input-email";
	const inputPassword = "input-password";
	const inputWorld = "input-world";
	const textareaWorkspace= "jscode";
	const demoLoad = "demo-load";
	const loggerBox = "log";
	
	// ~ HELPER FUNCTIONS ~

	// call a http request
	let makeHttpRequest = function(url, successCallback, failureCallback) {
		let request = new XMLHttpRequest();
		request.open('GET', url, true);

		request.onload = function() {
			if (this.status >= 200 && this.status < 400) {
				successCallback(this);
			} else {
				failureCallback();
			}
		};

		request.onerror = function(e) {
			failureCallback();
		};

		request.send();
	}

	// string replacing function
	let strRepl = function(str, search, repl) {
		while(str.indexOf(search) >= 0) str = str.replace(search, repl);
		return str;
	}

	// getById - smaller version of the long document.whatever
	let getById = function(id) {
		return document.getElementById(id);
	}

	// disable something
	let disable = function(id) {
		getById(id).disabled = true;
	}

	// enable something
	let enable = function(id) {
		getById(id).disabled = false;
	}
	
	// color something
	let color = function(htmlItem, color) {
		htmlItem.style.color = color;
	};
	
	// color something on the form then return it to a lighter color
	let colorItem = function(id, color1 = redMain, color2 = redFade) {
		let htmlItem = getById(id);
		color(htmlItem, color1);
		setTimeout(() => {
			color(htmlItem, color2);
		}, 600);
	}

	// run some text as a script on the page
	let runAsScript = function(textInput) {
		let scriptContainer = "script-container";

		let oldScript = document.getElementById(scriptContainer);

		if (oldScript) {
			oldScript.parentNode.removeChild(oldScript);
		}

		let newScript = document.createElement("script");
		newScript.id = scriptContainer;
		newScript.text = textInput;
		document.body.appendChild(newScript);
	}
	
	// pad a string with zeros
	let lpad = function(padString, length) {
    	var str = padString.toString();
    	while (str.length < length)
        	str = "0" + str;
    	return str;
	}
	
	// get the exact time
	let getTime = function(input, separator) {
		var pad = function(input) {return input < 10 ? "0" + input : input;};
    	var date = input ? new Date(input) : new Date();
    	return [
			lpad(date.getHours(), 2),
        	lpad(date.getMinutes(), 2),
        	lpad(date.getSeconds(), 2),
        	lpad(date.getMilliseconds(), 3)
    	].join(typeof separator !== 'undefined' ?  separator : ':' );
	}
	
	// put [] around something
	let surround = function(input) {
		return "[" + input + "]";
	}

	// ~ BUTTON ACTIONS
	
	// connect to a world
	var connect = function() {
		logger("Authenticating...");
		disable(buttonConnect);
		disable(buttonCompile);

		let email = getById(inputEmail).value;
		let password = getById(inputPassword).value;

		let promise = authenticate(email, password).then(auth => {
			logger("Authenticated!");
			eeide.client = auth.cli;
			eeide.config = auth.cfg;

			enable(buttonConnect);
			enable(buttonCompile);
			
			colorItem(buttonConnect, greenMain, greenFade);
		}).catch(err => {
			logger("Error Authenticating: " + err);
			console.log(err);
			
			enable(buttonConnect);
			
			colorItem(buttonConnect);
			
			throw err;
		});

		Promise.resolve(promise);
	}

	// runs the code
	var compile = function() {
		logger("Preparing compile...");
		disable(buttonConnect);
		disable(buttonCompile);

		if(eeide.connection !== undefined && eeide.connection !== null) {
			eeide.connection.disconnect();
		}

		logger("Joining room...");
		let promise = joinRoom(eeide.client, eeide.config, getById(inputWorld).value).then(con => {
			eeide.connection = con.con;

			logger("Running script...");
			runAsScript(
				"var connection = eeide.connection;" +
				"var client = eeide.client;" +
				"var config = eeide.config;" +
				"var log = eeide.logger;" +
				"try{" +
				editor.getSession().getValue() +
				"}catch(error){log(error, \"ERR\");}");
			
			colorItem(buttonCompile, greenMain, greenFade);

			enable(buttonConnect);
			enable(buttonCompile);
		}).catch(err => {
			
			logger("Error joining: " + err);
			console.log(err);
			
			enable(buttonConnect);
			enable(buttonCompile);
			
			colorItem(buttonCompile);
			
			throw err;
		});

		Promise.resolve(promise);
	}

	// replaces stuff and lets user save html file
	var transcode = function() {
		logger("Downloading transcode page...");
		let baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + "/";
		
		makeHttpRequest("transcode.html", function(e) {
			logger("Replacing strings...");
			let demoHtml = e.response;

			demoHtml = strRepl(demoHtml, "///", "");
			demoHtml = strRepl(demoHtml, "$baseUrl$", baseUrl);
			demoHtml = strRepl(demoHtml, "$userCode$", editor.getSession().getValue());

			let filename = "my-bot.html";

			logger("Serving download...");
			// stolen from stackoverflow
			// saves the stuff as a file
			var blob = new Blob([demoHtml], {type: 'text/html'});
			if(window.navigator.msSaveOrOpenBlob) {
				window.navigator.msSaveBlob(blob, filename);
			} else {
				var elem = window.document.createElement('a');
				elem.href = window.URL.createObjectURL(blob);
				elem.download = filename;        
				document.body.appendChild(elem);
				elem.click();        
				document.body.removeChild(elem);
			}
		}, function (err) {
			logger("Failed transcoding! " + err);
			alert("Failed loading the transcode html file!");
		});
	};

	// loads demos from folder on the repo
	var loaddemo = function() {
		logger("Loading demo...");
		let canErase = editor.getSession().getValue().length < 1;

		if(!canErase) {
			logger("Confirming workspace clear");
			canErase = confirm("Are you sure you want to clear the text in your workspace?");
		}

		logger("Will load demo: " + canErase);
		if(canErase) {
			logger("Clearing the editor");
			editor.getSession().setValue("");

			let dwnUrl = "demos/" + getById(demoLoad).value + "-demo.js";
			logger("Downloading " + dwnUrl);
			makeHttpRequest(dwnUrl, function(e) {
				logger("Loading demo into editor");
				editor.getSession().setValue(e.response);
				logger("Demo loaded!");
			}, function (err) {
				alert("Demo load failed! " + err);
			});
		}
	};
	
	// logs a line to the textarea
	var logger = function(msg, name = "EEJSIDE") {
		let logBox = getById(loggerBox);
		
		logBox.innerHTML += surround(getTime()) + " " + surround(name) + ": " + msg + "\n";
		
		logBox.scrollTo(0, logBox.scrollHeight);
	}
	
	var cliFriendlyLogger = function(msg) {
		logger(msg, "BOT");
	}

	eeide.connect = connect;
	eeide.compile = compile;
	eeide.transcode = transcode;
	eeide.loaddemo = loaddemo;
	eeide.client = null;
	eeide.config = null;
	eeide.logger = cliFriendlyLogger;

	disable(buttonCompile); // in case of refresh
	
	// load the local storage
	
	if(localStorage.botCode) {
		editor.getSession().setValue(localStorage.botCode);
	}
	
	// save every 10 seconds
	
	setInterval(() => {
		localStorage.botCode = editor.getSession().getValue();
	}, 10000);

	return eeide;
}

var eeide = EEIDE();

