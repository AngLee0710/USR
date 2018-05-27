"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema;

let actPostSchema = new mongoose.Schema({
	title: String,
	time: Number,
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
	let time = date.getTime();

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
	actPostUserModel.findOne({'title': title, 'time': day}, function(err, actPost) {
		if(err) {
			return callback(err);
		}
		actPostOwnerModel.update({'title': title, 'time': day}, {$inc: {'pv': 1}}, function(err) {
			if(err) {
				return callback(err);
			}
		});
		callback(null, actPost);
	});
}

actPost.getAll = function(callback) {
	actPostUserModel.find({}).sort('-time').exec(function(err, actPosts) {
		if(err) {
			return callback(err);
		}
		return callback(null, actPosts);
	});
}

actPost.edit = function(actPost, callback) {
	let query = {
		title: actPost.otitle,
		time: actPost.time
	}

	let update = {
		title: actPost.title,
		place: actPost.place,
		content: actPost.content
	}
	actPostOwnerModel.update(query, { $set: update }, (err, doc) => {
		if(err) {
			return callback(err);
		}
		callback(null, doc);
	});
}

actPost.remove = function(post, callback) {
	actPostOwnerModel.remove(post, (err) => {
		if(err) {
			return callback(err);
		}
		callback(null);
	})
}

actPost.getLimit = function(title, page, limit, callback) {
	actPostUserModel.count({}, function(err, total) {
		if(err){
			return callback(err);
		}
		actPostUserModel.find({}, null, {skip: (page -1) * limit}).sort('-time').limit(limit).exec(function(err, actPosts) {
			if(err){
				return callback(err);
			}
			return callback(null, actPosts, total);
		});
	});
};

module.exports = actPost;