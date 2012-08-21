/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

var mongoose = require('mongoose');
var db, Document;

app.configure('test', function() {
    app.use(express.errorHandler( {
	dumpExceptions: true,
	shockStack: true
    }));

    db = mongoose.createConnection('localhost', 'nodepad-test');
});

app.configure('development', function() {
    db = mongoose.createConnection('localhost', 'nodepad');
});

Document = require('./models.js').Document(db);


app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res) {
    res.redirect('http://localhost:3000/documents');
});

app.get('/new', function(req, res) {
});

var loadDocumentsPage = function(req, res) {
    Document.find().exec(function(err, documents) {
	switch(req.params.format) {
	    case 'json':
	    res.send(documents.map(function(d) {
		return d.toObject();
	    }));
	    break;

	    default:
	    res.render('documents/index.jade', {
		title: 'Documents',
		documents: documents 
	    });
	}
    });
};

app.get('/documents.:format?', function(req, res) {
    loadDocumentsPage(req, res);
});

app.post('/documents.:format?', function(req, res) {
    var document = new Document(req.body['document']);
    document.save(function(err, product) {
	if(err) {
	    console.log("err: " + err);
	    throw err;
	}

	switch(req.params.format) {
	    case 'json':
	    res.send(document.toObject());
	    break;
	    
	    default:
	    res.redirect('http://localhost:3000/documents');
	}
    });
});


//Edit document
app.get('/documents/:id.:format?/edit', function(req, res) {
    Document.findById(req.params.id, function(err, d) {
	res.render('documents/edit.jade', {
	    title: 'Edit Document',
	    d: d
	});
    });
});

//New document
app.get('/documents/new', function(req, res) {
    res.render('documents/new.jade', {
	title: 'New Document',
	d: new Document()
    });
});

// Read document
app.get('/documents/:id.:format?', function(req, res) {
    console.log('get /documents/:id.:format?');
});

// Update document
app.put('/documents/:id.:format?', function(req, res) {
    Document.findById(req.params.id, function(err, d) {
	d.title = req.body.document.title;
	d.data = req.body.document.data;

	d.save();

	res.redirect('/documents');
    });
});

// Delete document
app.del('/documents/:id.:format?', function(req, res) {
    Document.findByIdAndRemove(req.params.id, function(err, documents) {
	console.log(req.params.id + ' deleted.');
	// We don't need much of a response for this since the client side will handle the short term
	// removal of the entry.
	res.send("");
    });
});


http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

exports.app = app;
exports.Document = Document;