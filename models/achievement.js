"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema;
const actPost = require('./activity');
const Team = require('./team');

const htmlencode = require('htmlencode');

let achievementSchema = new Schema({
	ACT_ID: String,					//活動ID
	ACT_NAME: String,				//活動名稱
	ACT_BEG_DATE: Number,			//活動開始日期
	ACT_END_DATE: Number,			//活動結束日期
	ACT_LOCATION: {
		LOCATION_NAME: String,		//活動地名
		LOCATION_ADDR: String,		//活動地址
		LOCATION_LAT: Number,		//googleMapLat
		LOCATION_LNG: Number,		//googleMapLng
	},
	TEAM_ID: String,				//團隊ID
	TEAM_NAME: String,				//團隊名稱
	ACHI_IMG: [{NAME: String, URL: String}],
	ACHI_STORE: String,				//活動介紹
	ACHI_C_AT: {type: Number, default: Date.now},
	ACHI_C_USER: String,
	pv: {type: Number, default: 1},
	delete: { type: Boolean, default: false },
	wait_image: { type: String }
}, {
	collection: 'achievement'
});

let achievementOwnerModel = dbAuth.owner.model('achievement', achievementSchema);
let achievementUserModel = dbAuth.user.model('achievement', achievementSchema);

function achievement(ACT_ID, ACT_NAME, TEAM_NAME, ACT_BEG_DATE,
 ACT_END_DATE, ACT_LOCATION, ACHI_IMG, ACHI_STORE, TEAM_ID)
{
	this.ACT_ID = ACT_ID;
	this.ACT_NAME = ACT_NAME;
	this.TEAM_NAME = TEAM_NAME;
	this.ACT_BEG_DATE = ACT_BEG_DATE;
	this.ACT_END_DATE = ACT_END_DATE;
	this.ACT_LOCATION = ACT_LOCATION;
	this.ACHI_IMG = ACHI_IMG;
	this.ACHI_STORE = ACHI_STORE;
	this.TEAM_ID = TEAM_ID;
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
		ACHI_STORE: this.ACHI_STORE,
		TEAM_ID: this.TEAM_ID
	}

	let newAchievement = new achievementOwnerModel(achievement);

	newAchievement.save(function(err, doc) {
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
	achievementUserModel.find({'delete': false}).sort('-ACHI_C_AT').exec(function(err, actPosts) {
		if(err)
			return callback(err, null);
		else
			return callback(null, actPosts);
	});
}

achievement.getById = function(id, callback) {
	achievementUserModel.find({'_id': id}, (err, doc) => {
		if(err)
			return callback(err, null);
		else
			return callback(null, doc);
	});
}

//刪除 key = id
achievement.remove = function(id, callback) {
	achievementOwnerModel.update({'_id': id}, {$set:{delete: true}}, (err) => {
		if(err)
			return callback('error');
		else{
			return callback('success');
		}
	});
}

achievement.getByTeamId = function(id, callback) {
	achievementUserModel.find({'TEAM_ID': id, 'delete': false}, (err, doc) => {
		if(err)
			return callback(err, null);
		else
			return callback(null, doc);
	});
}

achievement.edit = function(id, update, callback) {
	achievementOwnerModel.update({'_id': id}, { $set: update }, (err) => {
		if(err)
			return callback(err);
		else 
			return callback(null);
	});
}

achievement.getLimit = function(team, page, limit, callback) {
	actPostUserModel.count({'delete': false}, function(err, total) {
		if(err)
			return callback(err);
		actPostUserModel.find({'TEAM_NAME': team, 'delete': false}, null, {skip: (page -1) * limit}).sort('-ACHI_C_AT').limit(limit).exec(function(err, actPosts) {
			if(err)
				return callback(err, null, null);
			else
				return callback(null, actPosts, total);
		});
	});
};

//拿到Team所有的成果
achievement.getAllOfTeamForManage = function(team, callback) {
	achievementUserModel.find({'TEAM_ID': team, 'delete': false}, {'TEAM_NAME': 1, 'ACT_END_DATE': 1, 'ACT_NAME': 1, 'ACT_ID': 1 }, (err, doc) => {
		if(err)
			return callback(err, null);
		else
			return callback(null, doc);
	});
}

//拿到所有成果(成果列表使用)
achievement.getAllAtList = function(callback) {
	achievementUserModel.find({'delete': false}, {'ACT_LOCATION': 1, 'TEAM_ID': 1, 'ACHI_STORE': 1, 'ACT_NAME': 1}, (err, actPosts) => {
		if(err)
			return callback(err, null);
		else
			return callback(null, actPosts);
	});
}

achievement.search = function(stuff, callback) {
	achievementUserModel.find({'TEAM_NAME': { $regex: stuff.TEAM_NAME }, 'ACT_NAME': { $regex: stuff.ACT_NAME }, 'ACT_LOCATION.LOCATION_NAME': { $regex: stuff.ACT_LOCATION.LOCATION_NAME }, 'ACT_LOCATION.LOCATION_ADDR': { $regex: stuff.ACT_LOCATION.LOCATION_ADDR }, 'ACT_BEG_DATE': { $gte: stuff.ACT_BEG_DATE_START, $lte: stuff.ACT_BEG_DATE_END }, 'delete': false }, {'TEAM_NAME': 1, 'ACT_NAME': 1, 'ACT_LOCATION': 1, 'ACT_BEG_DATE': 1, 'ACT_END_DATE': 1 }, (err, doms) => {
		if(err) { 
			return callback(err, null);
		} else {
			return callback(null, doms);
		}
	});
}

module.exports = achievement;