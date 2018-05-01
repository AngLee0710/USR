"use strict";
const mongodb = require('./db');
const MongoClient = mongodb.MongoClient;

function User(user) {
	this.name = user.name;
	this.password = user.password;
}

module.exports = User;

// save user-info
User.prototype.save = function(callback) {
	if(!(this.name && this.password)) {
		return callback('資料不齊全')
	}
	//user-info
	var user = {
		name: this.name,
		password: this.password,
	}

	MongoClient.connect(mongodb.url, function(err, client) {
		if(err) {
			return callback(err);
		}

		const db = client.db(mongodb.dbName);
		const col = db.collection('users');
		
		col.insert(user, function(err) {
			client.close();
			if(err) {
				return callback(err);
			}
			callback(null, user[0]);
		});
	});
}

//read user-data
User.get = function(name, callback) {
	MongoClient.connect(mongodb.url, function(err, client) {
		if(err) {
			return callback(err);
		}

		const db = client.db(mongodb.dbName);
		const col = db.collection('users');
		
		col.find({name:name}).next(function(err, user) {
			client.close();
			if(err) {
				return callback(err);
			}
			callback(null, user);
		});
	});
}

