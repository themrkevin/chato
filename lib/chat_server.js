/**
 *	Socket.IO server
 *	Server-side chat functionality
 **/
var socketio = require('socket.io'),
	io,
	guestNumber = 1,
	nickNames = {},
	namesUsed = [],
	currentRoom = {};

exports.listen = function(server) {
	io = socketio.listen(server);
	io.set('log level', 1);
	//	handle each user's connection
	io.sockets.on('connection', function(socket) {
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
		joinRoom(socket, 'Lobby');
		//	other handlers
		handleMessageBroadcasting(socket, nickNames);
		handleNameChangeAttempts(socket, nickNames, namesUsed);
		handleRoomJoining(socket);
		//	room list
		socket.on('rooms', function() {
			socket.emit('rooms', io.sockets.manager.rooms);
		});
		socket.on('users', function() {
			var room = currentRoom[socket.id],
				usersInRoom = io.sockets.clients(room),
				userList = '';
			for(var index in usersInRoom) {
				var userSocketId = usersInRoom[index].id;
					userList += '<li>'+nickNames[userSocketId]+'</li>';
			}
			socket.emit('users', userList);
		});
		//	disconnect and cleanup
		handleClientDisconnections(socket, nickNames, namesUsed);
	});
}
/**
 *	Helper Functions:
 *	chat functionality and fancy stuff
 **/
//	guest names for new users
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
	var name = 'Guest' + guestNumber;
	nickNames[socket.id] = name;
	socket.emit('nameResult', {
		success: true,
		name: name
	});
	namesUsed.push(name);
	return guestNumber + 1;
}
//	handler for joining rooms
function joinRoom(socket, room) {
	var prevRoom = currentRoom[socket.id];
	if(prevRoom) {
		socket.broadcast.to(prevRoom).emit('message', {
			text: nickNames[socket.id] + ' has left ' + prevRoom + '.'
		});
	}
	socket.join(room);
	currentRoom[socket.id] = room;
	socket.emit('joinResult', {
		room: room
	});
	// announce room joinage
	socket.broadcast.to(room).emit('message', {
		text: nickNames[socket.id] + ' has joined ' + room + '.'
	});
	//	user list
	var usersInRoom = io.sockets.clients(room);
	if(usersInRoom.length > 1) {
		var usersInRoomSummary = 'Users currently in ' + room + ': ';
		for(var index in usersInRoom) {
			var userSocketId = usersInRoom[index].id;
			if(userSocketId != socket.id) {
				if(index > 0) {
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary += '.';
		socket.emit('message', {
			text: usersInRoomSummary
		});
	}
}
//	handle name changes
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
	socket.on('nameAttempt', function(name) {
		//	names can't start with "Guest"
		if(name.indexOf('Guest') == 0) {
			socket.emit('nameResult', {
				success: false,
				message: 'Names cannot begin with "Guest".'
			});
		} else {
			//	register name if it isn't being used
			if(namesUsed.indexOf(name) == -1) {
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				//	delete previous name so it can be available to others
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult', {
					success: true,
					name: name
				});
				//	announce name change
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
					text: previousName + ' is now known as ' + name + '.'
				});
			} else {
				socket.emit('nameResult', {
					success: false,
					message: 'That name is already in use.'
				});
			}
		}
	});
}
//	sending chat messages and stuff
function handleMessageBroadcasting(socket) {
	socket.on('message', function(message) {
		// console.log(message);
		type = message.type;
		socket.broadcast.to(message.room).emit('message', {
			text : nickNames[socket.id] + ': ' + message.text,
			type : type
		});
	});
}
//	making rooms
function handleRoomJoining(socket) {
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}
//	user disconnections and junk
function handleClientDisconnections(socket) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		var prevRoom = currentRoom[socket.id];
		if(prevRoom) {
			// let everyone know you have disconnected
			socket.broadcast.to(prevRoom).emit('message', {
				text: nickNames[socket.id] + ' has disconnected.'
			});
		}
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}