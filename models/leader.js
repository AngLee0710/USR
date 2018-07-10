"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema;


let leaderSchema = new Schema({
	name: String,
	nick: String,
	title: String,
	headImg: String,
	email: String,
	phone: String,
	teams: [{name: String}],
	time: Number
}, {
	collection: 'leaders'
});

let leaderOwnerModel = dbAuth.owner.model('Leader', leaderSchema);
let leaderUserModel = dbAuth.user.model('Leader', leaderSchema);

function Leader(leader) {
	this.name = leader.name;
	this.nick = leader.nick;
	this.title = leader.title;
}

Leader.prototype.save = function(callback) {

	let date = new Date();
	let time = date.getTime();

	if(!(this.name && this.title && this.nick)) {
		return callback('資料不齊全');
	}
	let leader = {
		name: this.name,
		nick: this.nick,
		title: this.title,
		time: time
	};

	let newLeader = new leaderOwnerModel(leader);

	newLeader.save(function(err, leader) {
		if(err) {
			return callback(err);
		}
		callback(null, leader);
	});
}

Leader.check = function(nick, callback) {
	leaderUserModel.findOne({nick: nick}, function(err, nick) {
		if(err) {
			return callback(err);
		}
		callback(null, nick);
	});
}

Leader.getAll = function(callback) {
	leaderUserModel.find({}, function(err, leaders) {
		if(err) {
			return callback(err);
		}
		callback(null, leaders);
	});
}

Leader.get = function(id, callback) {
	leaderUserModel.findOne({_id: id}, function(err, leader) {
		if(err) {
			return callback(err);
		}
		callback(null, leader);
	});
}

Leader.getByNick = function(nick, callback) {
	leaderUserModel.findOne({nick: nick}, function(err, leader) {
		if(err)
			return callback(err);
		else 
			return callback(null, leader);
	});
}

Leader.edit = function(leader, callback) {
	let query = {
		nick: leader.nick
	}

	let update = {
		name: leader.name,
		title: leader.title,
		headImg: leader.headImg,
		phone: leader.phone,
		email: leader.email
	}

	leaderOwnerModel.update(query, { $set: update } , (err, doc) => {
		if(err) {
			return callback(err);
		}
		callback(null, doc);
	})
}

Leader.getLimit = function(name, page, limit, callback) {
	leaderUserModel.count({}, function(err, total) {
		if(err){
			return callback(err);
		}
		leaderUserModel.find({}, null, {skip: (page -1) * limit}).sort('-time').limit(limit).exec(function(err, actPosts) {
			if(err){
				return callback(err);
			}
			return callback(null, actPosts, total);
		});
	});
};

module.exports = Leader;