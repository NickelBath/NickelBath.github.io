// Demo JS Code - try pressing "connect" and then "compile"!
//
// This IDE includes for you:
// BlockHandler.js
// jsparse_clean.js
//
// So you can use whatever functions those have in your code!
//
// EEJSIDE gives you some variables to start with that you can use when coding. They are:
// 'connection' PlayerIOClient Connection
// 'client' PLayerIOClient Client
// 'config' ("config", "config") BigDB object
// 'log(msg)' Log a message to the EEJSIDE console
//
// ~by SirJosh3917/ninjasupeatsninja

// please only use var, 'let' will give you errors.
var testVar;

// add a callback handler
connection.addMessageCallback("*", function(m) {
	switch(m.type) {
			
		// on "init"
		case "init": {
			
			// send "init2"
			connection.send("init2");
		} break;
			
		// on "init2"
		case "init2": {
			log("init2 recieved!");
			
			// say "Hello, World!"
			connection.send("say", "Hello, World!");
		} break;
			
		// when someone says something
		case "say": {
			
			// if they said "!download"
			if(m.getString(1) == "!download") {
				log("Someone requested download!");
				
				// tell them that
				connection.send("say", "There is no download for this bot, it runs in your browser! Check out the Everybody Edits JavaScript IDE!");
			}
		} break;
	}
});

log("Sending init!");
// send "init"
connection.send("init");