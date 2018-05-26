"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema;


let leaderSchema = new Schema({
	name: String,
	nick: String,
	title: String,
	teams: [{name: String}],
}, {
	collection: 'leaders'
});

let leaderOwnerModel = dbAuth.owner.model('Leader', leaderSchema);
let leaderUserModel = dbAuth.user.model('Leader', leaderSchema);

function Leader(leader) {
	this.name = leader.name;
	this.nick = leader.nick;
	this.title = leader.title;
	this.team = leader.teams
}

Leader.prototype.save = function(callback) {

	if(!(this.name && this.title)) {
		return callback('資料不齊全');
	}
	let leader = {
		name: this.name,
		nick: this.nick,
		title: this.title,
		teams: this.team
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

module.exports = Leader;