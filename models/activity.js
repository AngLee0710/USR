"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema;

let actPostSchema = new mongoose.Schema({
	title: String,
	time: {},
	content: String,
	place: String,
	teams: [{name: String, leader: String}],
	pv: Number
}, {
	collection: 'actPosts'
});

let actPostOwnerModel = dbAuth.owner.model('actPost', actPostSchema);
let actPostUserModel = dbAuth.user.model('actPost', actPostSchema);


function actPost(title, content, place) {
	this.title = title;
	this.content = content;
	this.place = place;
}

actPost.prototype.save = function(callback) {
	if(!(this.title && this.content && this.place)) {
		return callback('資料不齊全');
	}

	let date = new Date();
	let time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" +
	   			(date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};

	let actPost = {
		title: this.title,
		time: time,
		content: this.content,
		place: this.place,
		teams: {},
		pv: 1
	};

	let newActPost = new actPostOwnerModel(actPost);

	newActPost.save(function(err) {
		if(err) {
			return callback(err);
		}
		callback(null);
	});
}

actPost.get = function(title, day, callback) {
	actPostUserModel.findOne({'title': title, 'time.day': day}, function(err, actPost) {
		if(err) {
			return callback(err);
		}
		actPostUserModel.update({'title': title, 'time.day': day}, {$inc: {'pv': 1}}, function(err) {
			if(err) {
				return callback(err);
			}
		});
		callback(null, actPost);
	});
}

actPost.getLimit = function(title, page, limit, callback) {
	actPostUserModel.count({}, function(err, total) {
		if(err){
			return callback(err);
		}
		actPostUserModel.find({}, null, {skip: (page -1) * limit}).sort('time.day').limit(limit).exec(function(err, actPosts) {
			if(err){
				return callback(err);
			}
			return callback(null, actPosts, total);
		});
	});
};

module.exports = actPost;