"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema;
const actPost = require('./activity');
const Team = require('./team');

let achievementSchema = new Schema({
	ACT_ID: String,
	ACT_NAME: String,
	ACT_BEG_DATE: Number,
	ACT_END_DATE: Number,
	ACT_LOCATION: {
		LOCATION_NAME: String,
		LOCATION_LAT: Number,
		LOCATION_LNG: Number,
	},
	TEAM_NAME: String,
	ACHI_C_AT: {type: Number, default: Date.now},
	pv: {type: Number, default: 1}
}, {
	collection: 'achievement'
});

let achievementOwnerModel = dbAuth.owner.model('achievement', achievementSchema);
let achievementUserModel = dbAuth.user.model('achievement', achievementSchema);

function achievement(ACT_ID, ACT_NAME, TEAM_NAME, ACT_BEG_DATE,
 ACT_END_DATE, ACT_LOCATION, ACHI_IMG, ACHI_STORE)
{
	this.ACT_ID = ACT_ID;
	this.ACT_NAME = ACT_NAME;
	this.TEAM_NAME = TEAM_NAME;
	this.ACT_BEG_DATE = ACT_BEG_DATE;
	this.ACT_END_DATE = ACT_END_DATE;
	this.ACT_LOCATION = ACT_LOCATION;
	this.ACHI_IMG = ACHI_IMG;
	this.ACHI_STORE = ACHI_STORE;
}

achievement.prototype.save = function(cb) {
	if(!this.ACT_ID)
		return cb('未選擇活動');
	else if(!this.ACT_LOCATION)
		return cb('未輸入地點');
	else if(!this.TEAM_NAME)
		return cb('未選擇團隊');
	else if(!this.ACHI_IMG)
		return cb('未上傳照片');
	else if(!this.ACHI_STORE)
		return cb('未數入成果分享內容');
	

	let achievement = {
		ACT_ID: this.ACT_ID,
		ACT_NAME: this.ACT_NAME,
		TEAM_NAME: this.TEAM_NAME,
		ACT_BEG_DATE: this.ACT_BEG_DATE,
		ACT_END_DATE: this.ACT_END_DATE,
		ACT_LOCATION: this.ACT_LOCATION,
		ACHI_IMG: this.ACHI_IMG,
		ACHI_STORE: this.ACHI_STORE
	}

	let newAchievement = new achievementOwnerModel(achievement);

	newAchievement.save(function(err, doc) {
		console.log(doc);
		if(err)
			return cb(err);
		else {
			actPost.achiCreate(achievement.ACT_ID, (err) => {
				if(err)
					return cb(err);
				else
					return cb(null);
			});
		}
	});
}

achievement.getAll = function(callback) {
	achievementUserModel.find({}).sort('-ACHI_C_AT').exec(function(err, actPosts) {
		if(err)
			return callback(err, null);
		else
			return callback(null, actPosts);
	});
}

//刪除 key = id
achievement.remove = function(id, callback) {
	achievementOwnerModel.deleteOne({'_id': id}, (err) => {
		if(err)
			return callback('error');
		else{
			return callback('success');
		}
	});
}

achievement.getByTeam = function(team, callback) {
	achievementOwnerModel.find({'TEAM_NAME': team}, (err, doc) => {
		if(err)
			return callback(err, null);
		else
			return callback(null, doc);
	});
}

achievement.getLimit = function(team, page, limit, callback) {
	actPostUserModel.count({}, function(err, total) {
		if(err)
			return callback(err);
		actPostUserModel.find({TEAM_NAME: team}, null, {skip: (page -1) * limit}).sort('-ACHI_C_AT').limit(limit).exec(function(err, actPosts) {
			if(err)
				return callback(err, null, null);
			else
				return callback(null, actPosts, total);
		});
	});
};

module.exports = achievement;