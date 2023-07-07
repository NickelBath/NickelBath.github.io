// BlockHandler.js Version 2.1 (by LukeM)

class TreeNode {
	constructor(value, parent) {
		this.value = value;
		this.depth = 0;
		this.parent = parent;
		this.before = null;
		this.after = null;
	}
	
	get beforeDepth() {
		return (this.before !== null ? this.before.depth + 1 : 0);
	}
	
	get afterDepth() {
		return (this.after !== null ? this.after.depth + 1 : 0);
	}
}

class BalancedTree {
	constructor(comparer) {
		this.comparer = comparer;
		this.root = null;
		this.first = null;
	}
	
	add(value) {
		if (this.root === null) {
			this.root = new TreeNode(value, null);
			this.first = value;
		} else {
			if (this.comparer(value, this.first) > 0) this.first = value;
			let child = this.root, node, before, depth = 0, difference;
			while (child !== null) {
				node = child;
				before = this.comparer(value, node.value) > 0;
				child = before ? node.before : node.after;
			}
			if (before) node.before = new TreeNode(value, node);
			else node.after = new TreeNode(value, node);
			
			while (node !== null && node.depth < ++depth) {
				node.depth = depth;
				difference = node.beforeDepth - node.afterDepth;
				if (difference > 1 || difference < -1) {
					let rotate = (root, isLeft) => {
						let pivot = isLeft ? root.before : root.after;
						if (isLeft) {
							root.before = pivot.after;
							if (root.before !== null) root.before.parent = root;
							pivot.after = root;
						} else {
							root.after = pivot.before;
							if (root.after !== null) root.after.parent = root;
							pivot.before = root;
						}
						pivot.parent = root.parent;
						if (root.parent === null) this.root = pivot;
						else if (root.parent.before === root) root.parent.before = pivot;
						else root.parent.after = pivot;
						root.parent = pivot;
						
						root.depth = Math.max(root.beforeDepth, root.afterDepth);
						pivot.depth = Math.max(pivot.beforeDepth, pivot.afterDepth);
					}
					
					if (difference > 0 && child.beforeDepth < child.afterDepth ||
						difference < 0 && child.beforeDepth > child.afterDepth)
						rotate(child, difference < 0);
					
					rotate(node, difference > 0);
					return;
				}
				child = node;
				node = node.parent;
			}
		}
	}
	
	remove(value) {
		let node = this.root, last = null, found, compared, before, direction, moved = false;
		while (node !== null && (compared = this.comparer(value, node.value)) !== 0) {
			before = compared > 0;
			node = before ? node.before : node.after;
		}
		if (node === null) return false;
		found = node;
		
		direction = found.beforeDepth > found.afterDepth;
		node = direction ? node.before : node.after;
		while (node !== null) {
			last = node;
			node = direction ? node.after : node.before;
			if (node !== null) moved = true;
		}
		
		if (last !== null) {
			if (this.comparer(found.value, this.first) === 0) this.first = last.value;
			node = direction ? last.before : last.after;
			found.value = last.value;
			if (direction !== moved) last.parent.before = node;
			else last.parent.after = node;
			if (node !== null) node.parent = last.parent;
			node = last;
		} else if (found.parent !== null) {
			node = found;
			if (this.comparer(found.value, this.first) === 0) this.first = found.parent.value;
			if (before) found.parent.before = null;
			else found.parent.after = null;
		} else {
			this.root = null;
			this.first = null;
		}
		
		if (node) {
			let oldDepth;
			do {
				node = node.parent;
				oldDepth = node.depth;
				node.depth = Math.max(node.beforeDepth, node.afterDepth);
			} while (node.parent !== null && node.depth !== oldDepth);
		}
		
		return true;
	}
	
	find(value) {
		let node = this.root, compared;
		while (node !== null && (compared = this.comparer(value, node.value)) !== 0)
			node = compared > 0 ? node.before : node.after;
		return node !== null ? node.value : null;
	}
}

class LinkedNode {
	constructor(value) {
		this.value = value;
		this.next = null;
	}
}

class LinkedList {
	constructor() {
		this.first = null;
		this.last = null;
	}
	
	add(value) {
		let last = new LinkedNode(value);
		if (this.last === null) this.first = last;
		else this.last.next = last;
		this.last = last;
	}
	
	remove() {
		let first = this.first;
		this.first = first.next;
		if (this.first === null) this.last = null;
		return first.value;
	}
}

class Block {
	constructor(id, ...args) {
		this.id = id;
		this.args = args;
	}
	
	equals(block) {
		return this.id === block.id &&
			this.args.length === block.args.length &&
			this.args.every((a, i) => a === block.args[i]);
	}
}

class BlockPlacement {
	constructor(l, x, y, block, prev, priority, blockNo) {
		this.l = l;
		this.x = x;
		this.y = y;
		this.block = block;
		this.prev = prev;
		this.priority = priority;
		this.blockNo = blockNo;
	}
	
	get message() {
		return ['b', this.l, this.x, this.y, this.block.id, ...this.block.args];
	}
}

class BlockHandler {
	constructor(con, botID, width, height, BPS = 100) {
		this.con = con;
		this.botID = botID;
		this.width = width;
		this.height = height;
		this.BPS = BPS;
		
		this.blocks = new Array(this.width);
		for (let x = 0; x < this.width; x++) {
			this.blocks[x] = new Array(this.height);
		}
		
		this.blockNo = 0;
		this.nextTick = null;
		this.timer = 0;
		this.paused = 0;
		this.queue = new BalancedTree((a, b) => a.priority - b.priority || b.blockNo - a.blockNo);
		this.queueLocs = new BalancedTree((a, b) => a.l - b.l || a.x - b.x || a.y - b.y);
		this.sent = new LinkedList();
		this.sentLocs = new BalancedTree((a, b) => a.l - b.l || a.x - b.x || a.y - b.y);
	}
	
	deserialise(msg) {
		msg = msg._internal_('get-objects');
		
		let empty = new Block(0);
		for (let x = 0; x < this.width; x++)
			for (let y = 0; y < this.height; y++)
				this.blocks[x][y] = [empty, empty];
		
		let i = msg.length - 1;
		while (msg[i--] !== 'we');
		while (msg[i] !== 'ws') {
			let args = [ ];
			while (!Array.isArray(msg[i]))
				args.push(msg[i--]);
			
			let ys = msg[i--],
				xs = msg[i--],
				l = msg[i--],
				id = msg[i--];
			
			let block = new Block(id, ...args);
			while (xs.length) this.blocks[xs.pop() + (xs.pop() << 8)][ys.pop() + (ys.pop() << 8)][l] = block;
		}
	}
	
	clear(fillFG = 0, borderFG = fillFG, fillBG = 0, borderBG = fillBG) {
		if (typeof fillFG === 'number') fillFG = new Block(fillFG);
		if (typeof borderFG === 'number') borderFG = new Block(borderFG);
		if (typeof fillBG === 'number') fillBG = new Block(fillBG);
		if (typeof borderBG === 'number') borderBG = new Block(borderBG);
		
		for (let x = 0; x < this.width; x++)
			for (let y = 0; y < this.height; y++)
				this.blocks[x][y] = x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1 ?
					[borderFG, borderBG] : [fillFG, fillBG];
	}
	
	place(priority, l, x, y, id, ...args) {
		let block = new Block(id, ...args);
		let b = this.queueLocs.find({ l: l, x: x, y: y });
		if (b === null) {
			if (!this.blocks[x][y][l].equals(block)) {
				b = new BlockPlacement(l, x, y, block, this.blocks[x][y][l], priority, this.blockNo++);
				this.queue.add(b);
				this.queueLocs.add(b);
				
				this.startTicking();
			}
		} else if (b.last.equals(block)) {
			this.queue.remove(b);
			this.queueLocs.remove(b);
		} else {
			b.block = block;
			if (priority > b.priority) {
				this.queue.remove(b);
				b.priority = priority;
				b.blockNo = this.blockNo++;
				this.queue.add(b);
			}
		}
	}
	
	block(msg, lPos) {
		msg = msg._internal_('get-objects');
		
		let l = lPos >= 0 ? msg.splice(lPos, 1)[0] : 0,
			pid = msg.pop(),
			x = msg.shift(),
			y = msg.shift(),
			block = new Block(msg.shift(), ...msg);
		
		if (pid === this.botID) {
			while (true) {
				let b = this.sent.remove();
				if (b.l === l && b.x === x && b.y === y) {
					if (b.block.equals(block)) {
						if (this.sentLocs.find(b) === b) {
							this.sentLocs.remove(b);
							if (this.queueLocs.find(b) === null) this.blocks[x][y][l] = block;
						}
						break;
					}
				} else if (this.sentLocs.find(b) === b &&
					this.queueLocs.find(b) === null) {
					this.sentLocs.remove(b);
					
					this.queue.add(b);
					this.queueLocs.add(b);
					
					this.startTicking();
				}
			}
		} else {
			let b = this.queueLocs.find({ l: l, x: x, y: y });
			if (b !== null) {
				this.queue.remove(b);
				this.queueLocs.remove(b);
			}
			this.sentLocs.remove({ l: l, x: x, y: y });
			this.blocks[x][y][l] = block;
		}
	}
	
	pause() {
		this.paused++;
	}
	
	resume() {
		this.paused--;
		this.startTicking();
	}
	
	clearQueue() {
		this.queue = new BalancedTree((a, b) => a.priority - b.priority || b.blockNo - a.blockNo);
		this.queueLocs = new BalancedTree((a, b) => a.l - b.l || a.x - b.x || a.y - b.y);
		this.sentLocs = new BalancedTree((a, b) => a.l - b.l || a.x - b.x || a.y - b.y);
	}
	
	startTicking() {
		if (this.paused == 0 && this.nextTick === null) {
			this.nextTick = Date.now();
			if (this.flusher !== null) {
				clearTimeout(this.flusher);
				this.flusher = null;
			}
			this.tick();
		}
	}
	
	tick() {
		if (this.paused > 0) {
			this.nextTick = null;
			return;
		}
		
		while (Date.now() >= this.nextTick) {
			let b = this.queue.first;
			if (b !== null) {
				this.queue.remove(b);
				this.queueLocs.remove(b);
				
				this.nextTick += 1000 / this.BPS;
				this.con.send(...b.message);
				this.sent.add(b);
				this.sentLocs.remove(b);
				this.sentLocs.add(b);
			} else {
				this.nextTick = null;
				this.flusher = setTimeout(this.flush.bind(this), 1000);
				return;
			}
		}
		
		setTimeout(this.tick.bind(this), 1000 / this.BPS);
	}
	
	flush() {
		this.flusher = null;
		while (this.sent.first !== null) {
			let b = this.sent.remove();
			if (this.sentLocs.find(b) === b &&
				this.queueLocs.find(b) === null) {
				this.sentLocs.remove(b);
				
				this.queue.add(b);
				this.queueLocs.add(b);
			}
		}
		
		if (this.nextTick === null) {
			this.nextTick = Date.now();
			this.tick();
		}
	}
}