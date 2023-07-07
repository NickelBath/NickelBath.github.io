window.onload = function() {
	
	changeItems("hide-on-load", "none");
	changeItems("show-on-load", "block");
};

function changeItems(className, displayType) {
	let items = document.getElementsByClassName(className);
	for(let i = 0; i < items.length; i++) {
		items[i].style.display = displayType;
	}
}