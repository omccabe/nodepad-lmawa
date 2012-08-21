var mongoose = require('mongoose');

var schema = new mongoose.Schema(
    {
	title: String,
	data: [String],
	tags: [String]
    });

mongoose.model('Document', schema);

exports.Document = function(db) {
    return db.model('Document');
};