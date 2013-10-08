/**
 *	Mongoose JS
 *	Database functionality
 **/
var mongoose = require('mongoose');

var dbURI = 'mongodb://localhost/chato';

exports.listen = function(server) {
	//	Connection
	mongoose.connect(dbURI);

	//	Connection Events
	mongoose.connection.on('connected', function() {
		console.log('Connected to ' + dbURI);
	});
	mongoose.connection.on('error', function(err) {
		console.log('Oops! ' + err);
	});
	mongoose.connection.on('disconnect', function() {
		console.log('Disconnected from ' + dbURI);
	});

	var msgSchema = mongoose.Schema({
		name: String,
		text: String,
		created: {type: Date, default: Date.now}
	});

	var emoteSchema = mongoose.Schema({
		name: String
	});

	var Emote = mongoose.model('Emote', emoteSchema);
}