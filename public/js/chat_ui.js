//	practice safe XSS, use protection.
function divEscapedContentElement(message, wrapper) {
	if(wrapper) {
		return $('<'+wrapper+'></'+wrapper+'>').text(message);
	} else {
		return $('<div></div>').text(message);
	}
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
	if(message.charAt(0) == '/') {
		//	treat messages that start with '/' as a command
		systemMessage = chatApp.processCommand(message);
		if(systemMessage) {
			messages$.append(divSystemContentElement(systemMessage));
		}
	} else if(message.charAt(0) == '(') {
		//	'(' means emote
		systemMessage = chatApp.processEmote(message);
		if(systemMessage) {
			chatApp.sendMessage($('#room').text(), systemMessage, 'emote');
			messages$.append('<div>'+systemMessage+'</div>');
		}
	} else {
		//	if its not a command, then we broadcast to room
		chatApp.sendMessage($('#room').text(), message);
		messages$.append(divEscapedContentElement(message));
	}
	scrollMessages();
	sendMessage$.val('');
}

function scrollMessages() {
	var messages$ = $('#messages');
	messages$.scrollTop(messages$.prop('scrollHeight'));
}
//	client-side initialization
var socket = io.connect();
//	DOM ready
$(function() {
	var chatApp = new Chat(socket),
		messages$ = $('#messages'),
		room$ = $('#room'),
		roomList$ = $('#room-list'),
		userList$ = $('#user-list'),
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
		console.log('Chat UI on Message',message);
		var newElement = $('<div></div>').text(message.text);
		if(message.type === 'emote') {
			newElement = $('<div></div>').html(message.text);
		}
		messages$.append(newElement);
		scrollMessages();
	});
	//	rooms list
	socket.on('rooms', function(rooms) {
		roomList$.empty();
		for(var room in rooms) {
			room = room.substring(1, room.length);
			if(room != '') {
				roomList$.append(divEscapedContentElement(room, 'li'));
			}
		}
		//	switch rooms by clicking on names
		roomList$.find('li').on('click', function() {
			chatApp.processCommand('/join ' + $(this).text());
			sendMessage$.focus();
		});
	});
	//	names list
	socket.on('users', function(userList) {
		userList$.empty();
		userList$.html(userList);
	})
	//	request room & user lists in intervals
	setInterval(function() {
		socket.emit('rooms');
		socket.emit('users');		
	}, 1000);
	sendMessage$.focus();
	sendForm$.on('submit',function() {
		processUserInput(chatApp, socket);
		return false;
	});
});