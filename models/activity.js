"use strict";
const mongodb = require('./db');

function actPost(title, content) {
	this.title = title;
	this.content = content;
}

module.exports = actPost;

actPost.prototype.save = function(callback) {
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

	let summary = this.content.toString();

	if(summary.length >= 20)
	{
		summary = summary.substr(0, 20) + '...';
	}

	let post = {
		title: this.title,
		time: time,
		summary: summary,
		content: this.content,
		teams: {},
		pv: 0
	};

	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('actPosts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			collection.insert(post, {
				safe: true
			}, function(err) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

actPost.getOne = function(title, day, callback) {
	//open database
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		//read posts collection
		db.collection('actPosts', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//according to user-name、post-date and post-title to search
			collection.findOne({
				"title": title,
				"time.day": day
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
						"title": title,
						"time.day": day,
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

actPost.getSix = function(name, page, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('actPosts', function(err, collection) {
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
					skip: (page - 1) * 6,
					limit: 6
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