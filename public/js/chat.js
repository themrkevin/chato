/**
 *	Client-side junk
 **/
var Chat = function(socket) {
	this.socket = socket;
}
//	sending messages
Chat.prototype.sendMessage = function(room, text) {
	var message = {
		room: room,
		text: text
	};
	this.socket.emit('message', message);
}
//	room changing
Chat.prototype.changeRoom = function(room) {
	this.socket.emit('join', {
		newRoom: room
	});
}
//	fancy chat commands
Chat.prototype.processCommand = function(command) {
	var words = command.split(' '),
		command = words[0].substring(1, words[0].length).toLowerCase(),
		message = false;

	switch(command) {
		case 'join':
			words.shift();
			var room = words.join(' ');
			this.changeRoom(room);
			break;

		case 'nick':
			words.shift();
			var name = words.join(' ');
			this.socket.emit('nameAttempt', name);
			break;

		default:
			message = 'Unrecognized command.';
			break;
	}
	return message;
}
//	fancy chat emotes
Chat.prototype.processEmote = function(emote) {
	var words = emote.split(' '),
		emote = words[0].substring(1, words[0].length - 1).toLowerCase(),
		message = false;
	console.log(emote);
	switch(emote) {
		case 'unicorn':
			words.shift();
			message = '<img src="../img/ultra-unicorn.png" class="emote" />';
			break;

		default:
			message = emote;
			break;
	}
	return message;
}