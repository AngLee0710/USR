const mongodb = require('./db');

function Team(name, introduction, pro_introduction, leader, achievement, website, email) {
	this.name = name;
	this.introduction = introduction;
	this.pro_introduction = pro_introduction;
	this.leader = leader;
	this.website = website;
	this.email = email;
}

module.exports = Team;

Team.prototype.save = function(callback) {
	let team = {
		name: this.name,
		introduction: this.introduction,
		pro_introduction: this.pro_introduction,
		leader: this.leader,
		achievement: [],
		website: this.website,
		email: this.email
	};

	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('teams', function(err, collection) {
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

Team.get = function(name, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection(function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name": name
			}, function(err, team) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, team);
			});
		});
	});
}