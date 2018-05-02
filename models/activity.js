"use strict"
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const uri = 'mongodb://localhost:27017/work?ssh=true';
mongoose.connect(uri);

let actPostSchema = new mongoose.Schema({
	title: String,
	content: String,
	place: String
}, {
	collection: 'actPosts'
});

let actPostModel = mongoose.model('actPost', actPostSchema);


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

	let newActPost = new actPostModel(actPost);

	newActPost.save(function(err, user) {
		if(err) {
			return callback(err);
		}
		callback(null, user);
	});
}

actPost.get = function(title, day, callback) {
	actPostModel.findOne({'title': title, 'time.day': day}, function(err, actPost) {
		if(err) {
			return callback(err);
		}
		actPostModel.update({'title': title, 'time.day': day}, {$inc: {'pv': 1}}, function(err) {
			if(err) {
				return callback(err);
			}
		});
		callback(null, actPost);
	});
}

actPost.getLimit = function(title, page, limit, callback) {
	actPostModel.count({}, function(err, total) {
		if(err){
			return callback(err);
		}
		actPostModel.find({}, null, {skip: (page -1) * limit}).sort('time.day').limit(limit).exec(function(err, actPosts) {
			if(err){
				return callback(err);
			}
			return callback(null, actPosts, total);
		});
	});
};

module.exports = actPost;