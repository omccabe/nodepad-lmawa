var mongoose = require('mongoose'),
    crypto   = require('crypto');

//Document

var docSchema = new mongoose.Schema({
    title : String,
    data  : [String],
    tags  : [String]
});

mongoose.model('Document', docSchema);

exports.Document = function(db) {
    return db.model('Document');
};


//User

var userSchema = new mongoose.Schema({
    email           : { type: String, index: { unique: true }},
    hashed_password : String,
    salt            : String
});

userSchema.virtual('password')
.set(function(pw) {
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(pw);
})
.get(function() { return this.hashed_password; });

userSchema.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
});

userSchema.method('encryptPassword', function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});

userSchema.method('authenticate', function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
});


userSchema.pre('save', function(next) {
    if(!this.password || this.password.length == 0
       || !this.email || this.email.length == 0) {
        next(new Error('You must supply an email and pasword'));
    }
    else {
        next();
    }
});

mongoose.model('User', userSchema);

exports.User = function(db) {
    return db.model('User');
};