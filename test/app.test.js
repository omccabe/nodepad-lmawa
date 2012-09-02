process.env.NODE_ENV = 'test';

var app = require('../app').app;
var Document = require('../app').Document;
var User = require('../app').User;
var assert = require('assert');
var request2 = require('superagent');
var should = require('should');

var server = 'http://localhost:3000/';

describe('Nodepad', function() {

    describe('GET /documents without being logged in', function() {
        it('should be rejected and redirected to login', function(done) {
            request2.get(server+'documents')
                .redirects(0)
                .end(function(res) {
                    res.statusCode.should.equal(303);
                    res.headers.location.should.include('sessions/new');
                    done();
                });
        });
    });

    describe('GET /users/new', function() {
        it('should be able to launch the new user page', function(done) {
            request2.get(server + 'users/new')
                .end(function(res) {
                    res.text.should.include('user[email]');
                    res.text.should.include('user[password]');
                    done();
                });
        });
    });

    function shouldRedirectToDocuments(res) {
        res.statusCode.should.equal(303);
        res.headers.location.should.include('documents');
    }

    function makeANewUser(user, callback) {
        request2.post(server + 'users/')
            .send(user)
            .redirects(0)
            .end(callback);
    }

    var user1Cookie, user2Cookie;

    describe('POST /users/.json', function() {
        it('should be able to make a new user', function(done) {
            makeANewUser({ user: { email: 'omccabe@gmail.com', 'password': 'test' }}, function(res) {
                shouldRedirectToDocuments(res);
                res.headers['set-cookie'][0].should.include('connect');
                user1Cookie = res.headers['set-cookie'][0];
                done();
            });
        });

        it('should be able to make a second user', function(done) {
            makeANewUser({ user: { email: 'amccabe@gmail.com', 'password': 'asdf' }}, function(res) {
                shouldRedirectToDocuments(res);
                res.headers['set-cookie'][0].should.include('connect');
                user2Cookie = res.headers['set-cookie'][0];
                user2Cookie.should.not.equal(user1Cookie);
                done();
            });
        });
    });


    describe('POST /documents.json', function() {
        it('should store the document in the database', function(done) {
            request2.post(server+'documents.json')
                .set('Cookie', user1Cookie)
                .send({document: {title: 'Test', tags: ["1234", "4567"], data: ["my note"] }})
                .end(function(res) {
                    res.body.title.should.equal('Test');
                    res.body.tags[0].should.equal("1234");
                    res.body.tags[1].should.equal("4567");
                    res.body.data[0].should.equal("my note");
                    done();
                });
        });
    });


    describe('POST /documents', function() {
        it('should be able to store via html', function(done) {
            request2.post(server+'documents')
                .set('Content-type', 'application/x-www-form-urlencoded')
                .set('Cookie', user1Cookie)
                .redirects(0)
                .send('document[title]=Another Test!')
                .end(function(res) {
                    shouldRedirectToDocuments(res);
                    done();
                });
        });
    });

    describe('GET /documents', function() {
        it('should be able to get the documents index', function(done) {
            request2.get(server+'documents')
                .set('Cookie', user1Cookie)
                .end(function(res) {
                    res.text.should.include('Test');
                    res.text.should.include('Another Test!');
                    done();
                });
        });

        it('should prevent the 2nd user from seeing the new documents', function(done) {
            request2.get(server+'documents')
                .set('Cookie', user2Cookie)
                .end(function(res) {
                    res.text.should.not.include('Test');
                    res.text.should.not.include('Another Test!');
                    done();
                });
        });

    });

    describe('GET /documents.json', function() {
        it('should find the document we just posted', function(done) {
            request2.get(server + 'documents.json')
                .set('Cookie', user1Cookie)
                .end(function(res) {

                    res.header['content-type'].should.include('application/json');
                    
                    res.body[0].title.should.equal('Test');
                    res.body[0].tags[0].should.equal("1234");
                    res.body[0].tags[1].should.equal("4567");

                    done();
                });
        });

        it('should not find the document for user 2', function(done) {
            request2.get(server + 'documents.json')
                .set('Cookie', user2Cookie)
                .end(function(res) {
                    res.header['content-type'].should.include('application/json');
                    res.body.should.be.empty;
                    done();
                });
        });
    });

    describe('PUT /documents.<id>', function() {
        it("should be able to edit a document", function(done) {
            Document.findOne({ title: 'Test'}).exec(function(err, res) {
                var editedTitle = 'My edited test';
                var editedData = 'Some new data';

                request2.put(server+'documents/'+res._id)
                    .set('Cookie', user1Cookie)
                    .redirects(0)
                    .send({ document: {
                        title: editedTitle,
                        data: editedData
                    }})
                    .end(function(putres) {
                        shouldRedirectToDocuments(putres);

                        request2.get(server + 'documents/' + res._id + '/edit')
                            .set('Cookie', user1Cookie)
                            .end(function(res) {
                                res.text.should.include(editedTitle);
                                res.text.should.include(editedData);

                                done();
                            });
                    });
            });
        });
    });

    describe('DELETE /documents.<id>', function() {
        it('should be able to delete a document', function(done) {
            var findIt = function(callback) {
                Document.findOne({ title: 'Another Test!' }).exec(function(err, res) {
                    callback(err, res);
                });
            };
            
            findIt(function(err, res) {
                request2.del(server + 'documents/' + res._id)
                    .set('Cookie', user1Cookie)
                    .redirects(0)
                    .end(function(res) {
                        res.statusCode.should.equal(200);

                        findIt(function(err, res) {
                            should.not.exist(res);
                            should.not.exist(err);

                            done();
                        });
                    });
            });
        });
    });


    //cleanup
    after(function(done) {
        Document.remove(function() {
            User.remove(function() {
                done();
            });
        });
    });
});

