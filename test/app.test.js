process.env.NODE_ENV = 'test';

var app = require('../app').app;
var Document = require('../app').Document;
var assert = require('assert');
var request2 = require('superagent');
var should = require('should');


var server = 'http://localhost:3000/';

describe('Nodepad', function() {

    describe('POST /documents.json', function() {
        it('should store the document in the database', function(done) {
            request2.post(server+'documents.json')
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
                .send('document[title]=Another Test!')
                .end(function(res) {
                    res.text.match('<li>Another Test!</li>');
                    done();
                });
        });
    });

    describe('GET /documents', function() {
        it('should be able to get the documents index', function(done) {
            request2.post(server+'documents')
                .end(function(res) {
                    res.text.match('<li>Test</li>');
                    done();
                });
        });
    });



    describe('GET /documents.json', function() {
        it('should find the document we just posted', function(done) {
            request2.get(server + 'documents.json')
            .end(function(res) {

                res.header['content-type'].should.include('application/json');
                
                res.body[0].title.should.equal('Test');
                res.body[0].tags[0].should.equal("1234");
                res.body[0].tags[1].should.equal("4567");

                done();
            });
        });
    });

    describe('GET /', function() {
        it("should return the documents page", function(done) {
            request2.get(server).end( function(res) {
                res.text.should.include('<title>Documents</title>');
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
                .send({ document: {
                    title: editedTitle,
                    data: editedData
                }})
                .end(function() {
                    request2.get(server + 'documents/' + res._id + '/edit')
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
                .end(function(res) {
                    res.body.should.eql({});

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
            console.log('all done!');
            done();
        });
    });
});

