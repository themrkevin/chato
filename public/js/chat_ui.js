//	practice safe XSS, use protection.
function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
}
function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message + '</i>');
}
//	processing raw user input
function processUserInput(chatApp, socket) {
	var sendForm$ = $('#send-form'),
		sendMessage$ = sendForm$.find('.send-message'),
		message = sendMessage$.val(),
		messages$ = $('#messages'),
		systemMessage;
		console.log(message);
	//	treat messages that start with '/' as a command
	if(message.charAt(0) == '/') {
		console.log(chatApp);
		systemMessage = chatApp.processCommand(message);
		if(systemMessage) {
			messages$.append(divSystemContentElement(systemMessage));
		}
	//	if its not a command, then we broadcast to room
	} else {
		chatApp.sendMessage($('#room').text(), message);
		messages$.append(divEscapedContentElement(message));
		messages$.scrollTop(messages$.prop('scrollHeight'));
	}
	sendMessage$.val('');
}
//	client-side initialization
var socket = io.connect();
//	DOM ready
$(function() {
	var chatApp = new Chat(socket),
		messages$ = $('#messages'),
		room$ = $('#room'),
		roomList$ = $('#room-list'),
		sendForm$ = $('#send-form'),
		sendMessage$ = sendForm$.find('.send-message');
	//	name change
	socket.on('nameResult', function(result) {
		var message;

		if(result.success) {
			message = 'You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}
		messages$.append(divSystemContentElement(message));
	});
	//	room change
	socket.on('joinResult', function(result) {
		room$.text(result.room);
		messages$.append(divSystemContentElement('Room changed.'));
	});
	//	display received messages
	socket.on('message', function(message) {
		var newElement = $('<div></div>').text(message.text);
		messages$.append(newElement);
	});
	//	rooms list
	socket.on('rooms', function(rooms) {
		roomList$.empty();
		for(var room in rooms) {
			room = room.substring(1, room.length);
			if(room != '') {
				roomList$.append(divEscapedContentElement(room));
			}
		}
		//	switch rooms by clicking on names
		roomList$.find('div').on('click', function() {
			chatApp.processCommand('/join ' + $(this).text());
			sendMessage$.focus();
		});
	});
	//	request room list in intervals
	setInterval(function() {
		socket.emit('rooms');
	}, 1000);
	sendMessage$.focus();
	sendForm$.on('submit',function() {
		processUserInput(chatApp, socket);
		return false;
	});
});