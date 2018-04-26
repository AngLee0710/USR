const mongodb = require('./db');

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

	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('teams', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			collection.insert(team, {
				safe: true
			}, function(err, team) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, team[0]);
			});
		});
	});
}

Team.get = function(name, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('teams', function(err, collection) {
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

Team.getSix = function(name, page, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('teams', function(err, collection) {
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

Team.getOne = function(name, callback) {
	//open database
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('teams', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//according to user-name、post-date and post-title to search
			collection.findOne({
				"name": name,
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
						"name": name
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