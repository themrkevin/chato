var http = require('http'),
	fs = require('fs'),
	path = require('path'),
	mime = require('mime'),
	cache = {};
/**
 *	Helper Functions:
 *	Sending file data and error responses
 **/
//	error reponse
function send404(response) {
	response.writeHead(404, {
		'Content-Type': 'text/plain'
	});
	response.write('Error 404: resource not found.');
	response.end();
}
//	file data
function sendFile(response, filePath, fileContents) {
	response.writeHeader(200, {
		'content-type': mime.lookup(path.basename(filePath))
	});
	response.end(fileContents);
}
//	caching static files to memory
function serveStatic(response, cache, absPath) {
	//	check if file is cached and serve
	if(cache[absPath]) {
		sendFile(response, absPath, cache[absPath]);
	} else {
		//	uncached files are read from disk then cached
		fs.exists(absPath, function(exists) {
			if(exists) {
				fs.readFile(absPath, function(err, data) {
					if(err) {
						send404(response);
					} else {
						cache[absPath] = data;
						sendFile(response, absPath, data);
					}
				});
			} else {
				//	oopsie, file doesn't exists :(
				send404(response);
			}
		});
	}
}
/**
 *	Creating the HTTP Server
 **/
//	sets up the server
var server = http.createServer(function(request, response) {
	var filePath = false,
		absPath;
	if(request.url == '/') {
		//	sets the default file
		filePath = 'public/index.html';
	} else {
		//	translates URL path to relative path
		filePath = 'public' + request.url;
	}
	absPath = './' + filePath;
	//	serve file
	serveStatic(response, cache, absPath);
})
/**
 *	Start the server
 *	Any port above 1024 is safe
 **/
server.listen(3000, function() {
	console.log('Server listening on port 3000.');
});
/**
 *	Socket.IO functionality
 **/
var chatServer = require('./lib/chat_server');
chatServer.listen(server);