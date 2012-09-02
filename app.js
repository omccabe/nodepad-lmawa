/**
 * Module dependencies.
 */

var express    = require('express'),
    app        = express(),
    routes     = require('./routes'),
    http       = require('http'),
    path       = require('path'),
    mongoose   = require('mongoose'),
    mongoStore = require('connect-mongodb');


app.configure('test', function() {
    app.use(express.errorHandler( {
        dumpExceptions: true,
        shockStack: true
    }));

    app.set('db-uri', 'mongodb://localhost/nodepad-test');
});

app.configure('development', function() {
    app.set('db-uri', 'mongodb://localhost/nodepad');
    app.use(express.errorHandler());
});

var db = mongoose.createConnection(app.get('db-uri'));
var Document = require('./models.js').Document(db);
var User = require('./models.js').User(db);

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());

    app.use(express.session({
        secret: 'secretKey',
        store : mongoStore(app.get('db-uri'))
    }));

    //This MUST come at the end or lots of stuff won't work. *grumble*
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));

});


var loadUser = function(req, res, next) {
    if (req.session.user_id) {
        User.findById(req.session.user_id, function(err, user) {
            if (user) {
                req.currentUser = user;
                next();
            } else {
                res.redirect(303,'/sessions/new');
            }
        });
    } else {
        res.redirect(303,'/sessions/new');
    }    
};


//Routes

app.get('/', loadUser, function(req, res) {
    res.redirect(303,'http://localhost:3000/documents');
});

app.get('/new', loadUser, function(req, res) {
});

var loadDocumentsPage = function(req, res) {
    Document.find({ user_id: req.session.user_id }).exec(function(err, documents) {
        switch(req.params.format) {
        case 'json':
            res.send(documents.map(function(d) {
                return d.toObject();
            }));
            break;

        default:
            res.render('documents/index.jade', {
                title: 'Documents',
                documents: documents,
                currentUser: req.currentUser
            });
        }
    });

};

app.get('/documents.:format?', loadUser, function(req, res) {
    loadDocumentsPage(req, res);
});

app.post('/documents.:format?', loadUser, function(req, res) {
    var document = new Document(req.body['document']);
    document.user_id = req.session.user_id;
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
            res.redirect(303,'http://localhost:3000/documents');
        }
    });
});


//Edit document
app.get('/documents/:id.:format?/edit', loadUser, function(req, res) {
    Document.findById(req.params.id, function(err, d) {
        if(d.user_id == req.session.user_id) {
            res.render('documents/edit.jade', {
                title: 'Edit Document',
                d: d
            });
        }
        else {
            res.send("Unauthorized");
        }
    });
});

//New document
app.get('/documents/new', loadUser, function(req, res) {
    res.render('documents/new.jade', {
        title: 'New Document',
        d: new Document()
    });
});

// Read document
app.get('/documents/:id.:format?', loadUser, function(req, res) {
    console.log('get /documents/:id.:format?');
});

// Update document
app.put('/documents/:id.:format?', loadUser, function(req, res) {
    Document.findById(req.params.id, function(err, d) {
        if(d.user_id == req.session.user_id) {
            d.title = req.body.document.title;
            d.data = req.body.document.data;
            d.user_id = req.session.user_id;

            d.save();
        }
        else {
            res.send("Unauthorized");
        }

        res.redirect(303,'http://localhost:3000/documents');
    });
});

// Delete document
app.del('/documents/:id.:format?', loadUser, function(req, res) {
    Document.findById(req.params.id, function(err, document) {
        if(document.user_id == req.session.user_id) {
            document.remove();
        }

        // We don't need much of a response for this since the client side will handle the short term
        // removal of the entry.
        res.send("");
    });
});


//Users

app.get('/users/new', function(req, res) {
    res.render('users/new.jade', {
        title: 'New user',
        user: new User()
    });
});

app.post('/users.:format?', function(req, res) {
    var user = new User(req.body.user);

    user.save(function(err) {
        if(err) {
            console.log(err);
            res.redirect(303,'/users/new');
        }
        else {
            req.session.user_id = user.id;
            res.redirect(303,'/documents');
        }
    });

});


//Sessions

app.get('/sessions/new', function(req, res) {
    res.render('sessions/new.jade', {
        title: 'Log In',
        user : new User()
    });
});

app.post('/sessions', function(req, response) {
    User.findOne({ email: req.body.user.email}).exec(function(err, res) {
        if(!err && res && res.authenticate(req.body.user.password)) {
            console.log('authenticated!');
            req.session.user_id = res.id;
            response.redirect(303,'/documents');
        }
        else {
            console.log('bad password');
            response.redirect(303,'/sessions/new');
        }
        
    });
});

app.del('/sessions', loadUser, function(req, res) {
    if(req.session) {
        req.session.destroy();
    }
    //res.redirect(303, '/sessions/new');
    res.send("");

});


http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

exports.app = app;
exports.Document = Document;
exports.User = User;
