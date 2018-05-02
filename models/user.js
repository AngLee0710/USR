"use strict"
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const uri = 'mongodb://localhost:27017/work?ssh=true';
mongoose.connect(uri);


let userSchema = new mongoose.Schema({
	name: String,
	password: String
}, {
	collection: 'users'
});

let userModel = mongoose.model('User', userSchema);

function User(user) {
	this.name = user.name;
	this.password = user.password;
}

User.prototype.save = function(callback) {
	if(!(this.name && this.password)) {
		return callback('資料不齊全')
	}

	let user = {
		name: this.name,
		password: this.password,
	}

	let newUser = new userModel(user);

	newUser.save(function(err, user) {
		if(err) {
			return callback(err);
		}
		return callback(null, user);
	});
}


User.get = function(name, callback) {
	userModel.findOne({name: name}, function(err, user) {
		if(err) {
			return callback(err);
		}
		callback(null, user);
	});
}

module.exports = User;
