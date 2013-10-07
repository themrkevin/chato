/**
 *	Mongoose JS
 *	Database functionality
 **/
var mongoose = require('mongoose');

exports.listen = function(server) {
	console.log('db_junk.js loaded');
	mongoose.connect('mongodb://localhost/chato', function(err) {
		if(err) throw err
		console.log('Connected to MongoDB');
	});

	var emoteSchema = mongoose.Schema({
		name: String
	});

	var Emote = mongoose.model('Emote', emoteSchema);
}