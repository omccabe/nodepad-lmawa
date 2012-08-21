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
	    .send({document: {title: 'Test', tags: ["1234", "4567"]}})
	    .end(function(res) {
		res.body.title.should.equal('Test');
		res.body.tags[0].should.equal("1234");
		res.body.tags[1].should.equal("4567");
		done();
	    });
	});
    });


    describe('POST /documents', function() {
	it('should be able to store via html', function(done) {
	    request2.post(server+'documents')
		.set('Content-type', 'application/x-www-form-urlencoded')
		.send('document[title]=Test')
		.end(function(res) {
		    res.text.match('<li>Test</li>');
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

		//cleanup
		res.body.forEach(function(d) {
		    //Document.findByIdAndRemove(d._id).exec();
		});

		done();
	    });
	});
    });

    describe('Get /', function() {
	it("should return the index page", function(done) {
	    request2.get(server).end( function(res) {
		res.text.should.include('<title>Express</title>');
		done();
	    });
	});
    });
});

