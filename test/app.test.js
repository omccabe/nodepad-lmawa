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

    var cookie;

    function shouldRedirectToDocuments(res) {
        res.statusCode.should.equal(303);
        res.headers.location.should.include('documents');
    }

    describe('POST /users/.json', function() {
        it('should be able to make a new user', function(done) {
            request2.post(server + 'users/')
                .send({ user: { email: 'omccabe@gmail.com', 'password': 'test' }})
                .redirects(0)
                .end(function(res) {
                    shouldRedirectToDocuments(res);
                    res.headers['set-cookie'][0].should.include('connect');
                    cookie = res.headers['set-cookie'][0];
                    done();
                });
        });
    });


    describe('POST /documents.json', function() {
        it('should store the document in the database', function(done) {
            request2.post(server+'documents.json')
                .set('Cookie', cookie)
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
                .set('Cookie', cookie)
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
                .set('Cookie', cookie)
                .end(function(res) {
                    res.text.match('<li>Test</li>');
                    res.text.match('<li>Another Test!</li>');
                    done();
                });
        });
    });

    describe('GET /documents.json', function() {
        it('should find the document we just posted', function(done) {
            request2.get(server + 'documents.json')
                .set('Cookie', cookie)
                .end(function(res) {

                    res.header['content-type'].should.include('application/json');
                    
                    res.body[0].title.should.equal('Test');
                    res.body[0].tags[0].should.equal("1234");
                    res.body[0].tags[1].should.equal("4567");

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
                    .set('Cookie', cookie)
                    .redirects(0)
                    .send({ document: {
                        title: editedTitle,
                        data: editedData
                    }})
                    .end(function(putres) {
                        shouldRedirectToDocuments(putres);

                        request2.get(server + 'documents/' + res._id + '/edit')
                            .set('Cookie', cookie)
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
                    .set('Cookie', cookie)
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

