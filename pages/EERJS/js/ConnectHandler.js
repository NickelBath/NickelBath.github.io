// ConnectHandler.js Version 1.0 (by LukeM)

const isHttps = location.protocol == 'https:';
PlayerIO.useSecureApiRequests = isHttps;

function asPromise(func, ...args) {
	return new Promise((resolve, reject) => func(...args, resolve, reject));
}

async function authenticate(email, password) { 
	let cli = await asPromise(PlayerIO.authenticate, "everybody-edits-v226-5ugofmmni06qbc11k5tqq", "simpleUsers", { email: email, password: password }, { });
	
	cli.multiplayer.useSecureConnections = isHttps;
	
	// const objPromise = asPromise(cli.bigDB.loadMyPlayerObject);
	const cfgPromise = asPromise(cli.bigDB.load, "config", "config");
	
	// let obj = await objPromise;
	
	/*if ("linkedTo" in obj) {
		
		let auth = await asPromise(cli.multiplayer.createJoinRoom, "auth" + cli.ConnectedUserId, "AuthRoom", true, null, { type: "Link" });
		
		let msg = await asPromise(auth.addMessageCallback, "auth");
		
		cli = await asPromise(PlayerIO.authenticate, "everybody-edits-su9rn58o40itdbnw69plyw", "linked", { userId: msg.getString(0), auth: msg.getString(1) }, { });
		cli.multiplayer.useSecureConnections = isHttps;
		
	}*/
	
	let cfg = await cfgPromise;
	
	return { cli: cli, cfg: cfg };
}

async function joinRoom(cli, cfg, worldID) {
	let roomType = "Everybodyedits";
	
	if (worldID.startsWith("BW")) {
		roomType = "Beta";
	}
	
	let con = await asPromise(cli.multiplayer.createJoinRoom, worldID, roomType + cfg.version, true, null, null);
	
	return { con: con };
}
