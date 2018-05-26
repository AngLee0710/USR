"use strict";
const mongodb = require('./db');

function Post(title, content, tag) {
	this.title = title;
	this.content = content;
}

module.exports = Post;

Post.prototype.save = function(callback) {
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

	let summary = this.content.substr(0, 40) + '...';

	let post = {
		title: this.title,
		time, time,
		summary: summary,
		content: this.content,
		pv: 0
	};

	MongoClient.connect(mongodb.url, function(err, client) {
		if(err) {
			return callback(err);
		}

		const db = client.db(mongodb.dbName);
		const col = db.collection('teams');
		
		col.insert(team, function(err) {
			client.close();
			if(err) {
				return callback(err);
			}
			callback(null);
		});
	});
}

Post.getOne = function(name, day, title, callback) {
	//open database
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		//read posts collection
		db.collection('posts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//according to user-name、post-date and post-title to search
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function(err, doc) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
				if(doc == null) {
					mongodb.close();
					err = 'data is null';
					return callback(err);
				}
				//analysis markdown is html
				if(doc) {
					collection.update({
						"name": name,
						"time.day": day,
						"title": title
					}, {
						$inc: {
							"pv": 1
						}
					}, function(err) {
						mongodb.close();
						if(err) {
							return callback(err);
						}
					});
				}
				callback(null, doc); //return query 
			});
		});
	});
}

Post.getTen = function(name, page, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			let query = {};
			if(name) {
				query.name = name;
			}

			collection.count(query, function(err, total) {
				collection.find(query, {
					skip: (page - 1) * 10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function(err, docs) {
					mongodb.close();
					if(err) {
						return callback(err);
					}
					callback(null, docs, total);
				});
			});
		});
	});
};