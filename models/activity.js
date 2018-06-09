"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema;

let actPostSchema = new mongoose.Schema({
	title: String,
	target: String,
	sex: String,
	date: String,
	fee: Number,
	time: Number,
	limit: Number,
	url: String,
	apply: String,
	content: String,
	place: String,
	teams: String,
	imgArr: [{url: String}],
	pv: Number
}, {
	collection: 'actPosts'
});

let actPostOwnerModel = dbAuth.owner.model('actPost', actPostSchema);
let actPostUserModel = dbAuth.user.model('actPost', actPostSchema);


function actPost(title, content, place, target, sex, date, limit, url, apply, team, fee, imgArr) {
	this.title = title;
	this.content = content;
	this.fee = fee;
	this.place = place;
	this.target = target;
	this.sex = sex;
	this.date = date;
	this.limit = limit;
	this.url = url;
	this.apply = apply;
	this.team = team;
	this.imgArr = imgArr; 
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
		fee: this.fee,
		date: this.date,
		teams: this.team,
		target: this.target,
		sex: this.sex,
		limit: this.limit,
		url: this.url,
		apply: this.apply,
		imgArr: this.imgArr,
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

actPost.getById = function(id, callback) {
	actPostUserModel.findOne({'_id': id}, function(err, actPost) {
		if(err) {
			return callback(err);
		}
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

actPost.edit = function(id, actPost, callback) {
	console.log(actPost);
	actPostOwnerModel.update(id, { $set: actPost }, (err, doc) => {
		if(err) {
			return callback(err);
		}
		callback(null, doc);
	});
}

actPost.remove = function(id, callback) {
	actPostOwnerModel.deleteOne({_id: id}, (err, doc) => {
		if(err){
			return callback(err);
		}
		return callback(null);
	});
}

actPost.getLimit = function(title, page, limit, callback) {
	if(limit == 'max'){
		actPostUserModel.count({}, function(err, total) {
			if(err){
				return callback(err);
			}
			actPostUserModel.find({}, null, {skip: (page -1) * limit}).sort('-time').exec(function(err, actPosts) {
				if(err){
					return callback(err);
				}
				return callback(null, actPosts, total);
			});
		});
	}else{
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
	}
	
};

module.exports = actPost;