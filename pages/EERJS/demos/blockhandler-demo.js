// BlockHandler Demo
//
// BlockHandler acts as a layer between you and EE, so that you don't need to worry
// about things like block placement timing, or replacements when blocks fail.
//
// This allows you to focus on your bot's features instead of EE's quirks :D
//
// To place blocks, use BH.place(priority, layer, x, y, (optional)arg1, arg2, ...)
//
// Example by LukeM :)
//

var BH;

connection.addMessageCallback("*", function(m) {
	switch(m.type) {
		case "init":{
			connection.send("init2");
			
			// This sets up the world, so it knows what blocks start where.
			// The last value is the number of blocks placed per second.
			BH = new BlockHandler(connection, m.getInt(5), m.getInt(18), m.getInt(19), 50);
			BH.deserialise(m);
		} break;
		case "init2": {
			for (let x = 5; x < 20; x++) {
				for (let y = 10; y < 15; y++) {
					// Priorities can be used to decide which blocks are placed first.
					// Higher priority blocks are placed first.
					BH.place(Math.random(), 0, x, y, 10);
				}
			}
		} break;
		case "say": {
			let msg = m.getString(1).substring(1).split(" ");
			switch (msg[0]) {
				case "test": {
					for (let y = 5; y < 20; y++) {
						for (let x = 10; x < 15; x++) {
							// Only blocks that are needed are placed, what's already there is skipped.
							BH.place(0, 0, x, y, 10);
						}
					}
				} break;
				case "blockAt": {
					// Get the arguments
					let x = parseInt(msg[1]), y = parseInt(msg[2]), l = parseInt(msg[3]);
					
					// Check if the arguments are valid
					// BH.width and BH.height are the width and the height of the world
					if (isNaN(x) || isNaN(y) || isNaN(l) ||
						x < 0 || x >= BH.width ||
						y < 0 || y >= BH.width ||
						l < 0 || l >= 2) {
						connection.send("say", "Usage: !blockAt (x) (y) (layer)");
						return;
					}
					
					// Blocks can be looked up using BH.blocks[x][y][l]
					let block = BH.blocks[x][y][l];
					
					// block.id is the ID of the block
					// block.args is an array of arguments (e.g. coin door coins)
					connection.send("say", "ID: " + block.id + ", Args: " + block.args.join(", "));
				} break;
				case "pause": {
					// Pauses block placements
					BH.pause();
				} break;
				case "resume": {
					// Resumes block placements
					BH.resume();
				} break;
				case "clearQueue": {
					// Stops all queued block placements
					BH.clearQueue();
				} break;
			}
		} break;
		
		// Let BlockHandler know that the world was reset
		case 'reset': {
			BH.clearQueue();
			BH.deserialise(m);
		} break;
		case 'clear': {
			BH.clearQueue();
			BH.clear(m.getUInt(2), m.getUInt(3));
		} break;
		
		// Let BlockHandler know that blocks were placed
		case 'b': {
			BH.block(m, 0);
		} break;
		case 'br': {
			BH.block(m, 4);
		} break;
		case 'bc': case 'bn': case 'bs': case 'lb': case 'pt': case 'ts': case 'wp': {
			BH.block(m);
		} break;
	}
});

connection.send("init");