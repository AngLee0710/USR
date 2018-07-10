"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema; 


let userSchema = new Schema({
	name: String,
	password: String
}, {
	collection: 'users'
});

let userOwnerModel = dbAuth.owner.model('User', userSchema);
let userUserModel = dbAuth.user.model('User', userSchema);

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

	let newUser = new userOwnerModel(user);

	newUser.save(function(err, user) {
		if(err) {
			return callback(err);
		}
		return callback(null, user);
	});
}


User.get = function(name, callback) {
	userUserModel.findOne({name: name}, function(err, user) {
		if(err) {
			return callback(err);
		}
		callback(null, user);
	});
}

module.exports = User;
