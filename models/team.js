"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema;
const Leader = require('./leader.js')

let teamSchema = new Schema({
	name: String,
	leader: String,
	purpose: String,
	introduction: String,
	pro_introduction: String,
	website: String,
	connection: {
		name: String,
		email: String,
		phone: Number
	},
	achievement: [{title: String, date: String}],
	pv: Number
}, {
	collection: 'teams'
});

let teamOwnerModel = dbAuth.owner.model('Team', teamSchema);
let teamUserModel = dbAuth.user.model('Team', teamSchema);

function Team(team) {
	this.name = team.name;
	this.leader = team.leader;
	this.leader_title = team.leader_title;
	this.leader_nick = team.leader_nick;
	this.purpose = team.purpose;
	this.introduction = team.introduction;
	this.pro_introduction = team.pro_introduction;
	this.website = team.website;
	this.connection = {
		name: team.connection.name,
		email: team.connection.email,
		phone: team.connection.phone
	}
}

Team.prototype.save = function(callback) {

	if(!(this.name && this.leader && this.purpose && this.introduction &&
	 this.pro_introduction && this.website && this.connection.name &&
	 this.connection.email && this.connection.phone)) {
		return callback('資料不齊全');
	}
	let team = {
		name: this.name,
		leader: this.leader,
		purpose: this.purpose,
		introduction: this.introduction,
		pro_introduction: this.pro_introduction,
		website: this.website,
		connection: {
			name: this.connection.name,
			email: this.connection.email,
			phone: this.connection.phone
		},
		achievement: [],
		pv: 0
	};

	let newTeam = new teamOwnerModel(team);

	newTeam.save(function(err, team) {
		if(err) {
			return callback(err);
		}
		Leader.pushTeam(team.leader, team.name, (err) => {
			if(err) {
				return callback(err);
			}
		});
		return callback(null, team);
	});
}

Team.check = function(name,callback) {
	teamUserModel.findOne({name: name}, function(err, team) {
		if(err) {
			return callback(err);
		}
		callback(null, team);
	});
}

Team.get = function(name, callback) {
	teamUserModel.findOne({name: name}, function(err, team) {
		if(err) {
			return callback(err);
		}
		teamOwnerModel.update({name:name}, {$inc: {pv: 1}}, function(err) {
			if(err) {
				return callback(err);
			}
		});
		callback(null, team);
	});
}

Team.getLimit = function(name, page, limit, callback) {
		teamUserModel.count({}, function(err, total) {
		if(err){
			return callback(err);
		}
		teamUserModel.find({}, null, {skip: (page -1) * limit}).sort('time.day').limit(limit).exec(function(err, teams) {
			if(err){
				return callback(err);
			}
			return callback(null, teams, total);
		});
	});
}


module.exports = Team;