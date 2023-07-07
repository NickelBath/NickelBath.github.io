//
// This is a simple example of using jsparse to store the blocks of a world!
// 
// In this example, we'll read every sign out to the console!
//
// ~by SirJosh3917/ninjasupeatsninja

var parseSigns = function(e) {
	// jsparse(e) will parse out the world, and we'll only accept anything that has id 385 ( signs )
	let signs = jsparse(e).filter(b => b.id == 385); // credit to https://github.com/atillabyte/EEWebs/blob/master/js/eewebs.js#L27

	// for every sign
	signs.forEach((i) => {

		// log the text to the log window
		log(i.args[1]);
	});

	if(e.type == "init") {
		// send init2
		connection.send("init2");
	}
};

connection.addMessageCallback("init", parseSigns);
connection.addMessageCallback("reset", parseSigns);

connection.send("init");
