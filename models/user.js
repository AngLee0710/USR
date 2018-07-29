"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema; 


let userSchema = new Schema({
	FBID: {type: String, default: null},
	NFUID: {type: String, default: null},
	NAME: String,
	EMAIL: {type: String, default: null},
	BIRTHDAY: {type: Number, default: null},
	FIRST_NAME: {type: String, default: null},
	LAST_NAME: {type: String, default: null},
}, {
	collection: 'users'
});

let userOwnerModel = dbAuth.owner.model('User', userSchema);
let userUserModel = dbAuth.user.model('User', userSchema);

function User(user) {
	this.name = user.name;
	this.email = user.email;
	this.birthday = user.birthday;
	this.first_name = user.first_name;
	this.last_name = user.last_name;
	this.fbid = user.fbid;
	this.nfuid = user.nfuid;
}

User.prototype.save = function(callback) {
	let user = {
		FBID: this.fbid,
		NFUID: this.nfuid,
		NAME: this.name,
		EMAIL: this.email,
		BIRTHDAY: this.birthday,
		FIRST_NAME: this.first_name,
		LAST_NAME: this.last_name 	
	}

	let newUser = new userOwnerModel(user);

	newUser.save(function(err, user) {
		if(err) {
			return callback(err);
		}
		return callback(null, user);
	});
}

User.getByFbId = function(id, callback) {
	if(id) {
		userUserModel.findOne({FBID: id}, function(err, user) {
			if(err) {
				return callback(err);
			}
			return callback(null, user);
		});
	} else {
		return callback(null, null);
	}
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
