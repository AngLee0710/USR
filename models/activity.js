"use strict";
const mongodb = require('./db');
const MongoClient = mongodb.MongoClient;

function actPost(title, content) {
	this.title = title;
	this.content = content;
}

module.exports = actPost;

actPost.prototype.save = function(callback) {
	if(!(this.title && this.content)) {
		return callback('資料不齊全');
	}
	let date = new Date();
	let time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +
			date.getDate(),
		minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +
			date.getDate() + " " + date.getHours() + ":" +
			(date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};


	let post = {
		title: this.title,
		time: time,
		content: this.content,
		teams: {},
		pv: 1
	};

	MongoClient.connect(mongodb.url, function(err, client) {
		if(err) {
			return callback(err);
		}

		const db = client.db(mongodb.dbName);
		const col = db.collection('actPosts');
		
		col.insert(post, function(err) {
			client.close();
			if(err) {
				return callback(err);
			}
			callback(null);
		});
	});
}

actPost.getOne = function(title, day, callback) {
	MongoClient.connect(mongodb.url, function(err, client) {
		if(err) {
			return callback(err);
		}

		const db = client.db(mongodb.dbName);
		const col = db.collection('actPosts');
		console.log(day);
		
		col.find({"title": title, "time.day": day}).next(function(err, post) {
			if(err) {
				client.close();
				return callback(err);
			}
			if(post) {
				col.update({"title": title, "time.day": day},{$inc: {pv: 1}}, function(err) {
					client.close();
					if(err) {
						return callback(err);
					}
				});
				return callback(null, post);
			}
		});
	});
}

actPost.getSix = function(name, page, callback) {
	MongoClient.connect(mongodb.url, function(err, client) {
		if(err) {
			return callback(err);
		}

		const db = client.db(mongodb.dbName);
		const col = db.collection('actPosts');

		let query = {};
		if(name) {
			query.name = name;
		}

		col.count({}, function(err, total) {
			col.find({}).skip((page - 1) * 6).limit(6).sort('time', 1).toArray(function(err, docs) {
				client.close();
				if(err) {
					return callback(err);
				}
				return callback(null, docs, total);
			});
		});
	});
};