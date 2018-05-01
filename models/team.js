"use strict";
const mongodb = require('./db');
const MongoClient = mongodb.MongoClient;

function Team(team) {
	this.name = team.name;
	this.leader = team.leader;
	this.purpose = team.purpose;
	this.introduction = team.introduction;
	this.pro_introduction = team.pro_introduction;
	this.website = team.website;
	this.email = team.email;
}

module.exports = Team;

Team.prototype.save = function(callback) {
	if(!(this.name && this.leader && this.purpose && this.introduction &&
	 this.pro_introduction && this.website && this.email)) {
		return callback('資料不齊全');
	}
	let team = {
		name: this.name,
		leader: this.leader,
		purpose: this.purpose,
		introduction: this.introduction,
		pro_introduction: this.pro_introduction,
		website: this.website,
		email: this.email,
		achievement: [],
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

Team.getSix = function(name, page, callback) {
	MongoClient.connect(mongodb.url, function(err, client) {
		if(err) {
			return callback(err);
		}

		const db = client.db(mongodb.dbName);
		const col = db.collection('teams');

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

Team.getOne = function(name, callback) {
	MongoClient.connect(mongodb.url, function(err, client) {
		if(err) {
			return callback(err);
		}

		const db = client.db(mongodb.dbName);
		const col = db.collection('teams');
		
		col.find({name: name}).next(function(err, team) {
			if(err) {
				client.close();
				return callback(err);
			}
			if(team) {
				col.update({name: team.name},{$inc: {pv: 1}}, function(err) {
					client.close();
					if(err) {
						return callback(err);
					}
				});
				return callback(null, team);
			}
			return callback(null, null);
		});
	});
}