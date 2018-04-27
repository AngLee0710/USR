"use strict";
const mongodb = require('./db');


function User(user) {
	this.name = user.name;
	this.password = user.password;
}

module.exports = User;

// save user-info
User.prototype.save = function(callback) {
	//user-info
	var user = {
		name: this.name,
		password: this.password,
	}

	//open database
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}

		//read users collection
		db.collection('users', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);//error, return err info
			}
			
			// insert user-data to users collection
			collection.insert(user, {
				safe: true
			}, function(err, user) {
				mongodb.close();
				if(err) {
					return callback(err);//error, return err info
				}

				callback(null, user[0]);//success! err is null, return stored user-file
			})
		})
	})
}

//read user-data
User.get = function(name, callback) {
	//open database
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);//error, return err info
		}

		//read users collection
		db.collection('users', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);//error, return err info
			}

			//query user-data-name file
			collection.findOne({
				name: name
			}, function(err, user) {
				mongodb.close();
				if(err) {
					return callback(err);//error, return err info
				}
				callback(null, user);//success!return query user-info
			})
		})
	})
}

