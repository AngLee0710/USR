"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema;

let actPostSchema = new Schema({
	ACT_ID: {type: Number, default: null},
	ACT_KIND: {type: String, default:'D'},
	ACT_SUBJ_NAME: String,
	ACT_BEG_DATE: String,
	ACT_END_DATE: String,
	ACT_OPEN_TIME: {type: Date, default: null},
	ACT_DEPTNAME: String,
	ACT_LOCATION: {
		LOCATION_NAME: String,
		LOCATION_ADDR: String,
		LOCATION_LAT: Number,
		LOCATION_LNG: Number
	},
	ACT_LIMIT: {type: Number, default: 9999},
	ACT_LIMIT_R: {type: String, default: 'O'},
	ACT_LIMIT_SEX: {type: String, default: 'N'},
	ACT_URL: String,
	ACT_COMM_USER: String,
	ACT_COMM_TEL: String,
	ACT_COMM_EMAIL: String,
	ACT_FLAG: {type: String, default: 'Y'},
	ACT_B_BEG: Number,
	ACT_B_END: Number,
	ACT_C_AT: {type: Number, default: Date.now},
	ACT_U_AT: Number,
	ACT_K_TEL: {type: String, default: 'N'},
	ACT_K_DEPT: {type: String, default: 'N'},
	ACT_K_OCCUP: {type: String, default: 'N'},
	ACT_K_IDNO: {type: String, default: 'N'},
	ACT_K_SEX: {type: String, default: 'N'},
	ACT_K_BIRTH: {type: String, default: 'N'},
	ACT_K_FOOD: {type: String, default: 'N'},
	ACT_K_SURE: {type: String, default: 'N'},
	ACT_K_ADDR: {type: String, default: 'N'},
	ACT_LIST: String,
	ACT_IMGARR: [{image: String}],
	ACT_SIGN_NUM: {type: Number, default: 0},
	ACT_NOT_SIGN: {type: Boolean, default: true},
	ACT_TAG: [{ NAME: String }],
	ACT_ACHI: {type: Boolean, default: false},
	ACT_C_USER: String,
	pv: {type: Number, default: 1}
}, {
	collection: 'actPosts'
});

let actPostOwnerModel = dbAuth.owner.model('actPost', actPostSchema);
let actPostUserModel = dbAuth.user.model('actPost', actPostSchema);


function actPost(ACT_SUBJ_NAME, ACT_BEG_DATE, ACT_END_DATE, ACT_DEPTNAME, ACT_LOCATION, ACT_LIMIT_SEX, ACT_LIMIT, ACT_URL, ACT_COMM_USER, ACT_COMM_TEL, ACT_COMM_EMAIL, ACT_B_BEG, ACT_B_END, ACT_K_TEL, ACT_K_DEPT, ACT_K_OCCUP, ACT_K_IDNO, ACT_K_SEX, ACT_K_BIRTH, ACT_K_FOOD, 
	ACT_K_ADDR, ACT_LIST, ACT_IMGARR, ACT_NOT_SIGN)
{
	this.ACT_SUBJ_NAME = ACT_SUBJ_NAME;
	this.ACT_BEG_DATE = ACT_BEG_DATE;
	this.ACT_END_DATE = ACT_END_DATE;
	this.ACT_DEPTNAME = ACT_DEPTNAME;
	this.ACT_LOCATION = ACT_LOCATION;
	this.ACT_LIMIT = ACT_LIMIT;
	this.ACT_URL = ACT_URL;
	this.ACT_LIMIT_SEX = ACT_LIMIT_SEX;
	this.ACT_COMM_USER = ACT_COMM_USER;
	this.ACT_COMM_TEL = ACT_COMM_TEL;
	this.ACT_COMM_EMAIL = ACT_COMM_EMAIL;
	this.ACT_B_BEG = ACT_B_BEG;
	this.ACT_B_END = ACT_B_END;
	this.ACT_K_TEL = ACT_K_TEL;
	this.ACT_K_DEPT = ACT_K_DEPT;
	this.ACT_K_OCCUP = ACT_K_OCCUP;
	this.ACT_K_IDNO = ACT_K_IDNO;
	this.ACT_K_SEX = ACT_K_SEX;
	this.ACT_K_BIRTH = ACT_K_BIRTH;
	this.ACT_K_FOOD = ACT_K_FOOD;
	this.ACT_K_ADDR = ACT_K_ADDR;
	this.ACT_LIST = ACT_LIST;
	this.ACT_IMGARR = ACT_IMGARR;
	this.ACT_NOT_SIGN = ACT_NOT_SIGN;
}

actPost.prototype.save = function(cb) {
	if(!this.ACT_SUBJ_NAME)
		return cb('未輸入活動名稱');
	else if(!this.ACT_BEG_DATE)
		return cb('未輸入活動開始時間');
	else if(!this.ACT_END_DATE)
		return cb('未輸入活動結束時間');
	else if(!this.ACT_DEPTNAME)
		return cb('未輸入主辦隊伍');
	else if(!this.ACT_LOCATION.LOCATION_NAME)
		return cb('未輸入活動地點名稱');
	else if(!this.ACT_LOCATION.LOCATION_LAT)
		return cb('未輸入活動地點lat');
	else if(!this.ACT_LOCATION.LOCATION_LNG)
		return cb('未輸入活動地點lng');
	else if(!this.ACT_LIMIT)
		return cb('未輸入人數上限');
	else if(!this.ACT_COMM_USER)
		return cb('未輸入聯絡人姓名');
	else if(!this.ACT_COMM_TEL)
		return cb('未輸入聯絡人電話');
	else if(!this.ACT_COMM_EMAIL)
		return cb('未輸入聯絡人信箱');
	else if(!this.ACT_B_BEG)
		return cb('未輸入開放報名時間');
	else if(!this.ACT_B_END)
		return cb('未輸入結束報名時間');

	let actPost = {
		ACT_SUBJ_NAME: this.ACT_SUBJ_NAME,
		ACT_BEG_DATE: this.ACT_BEG_DATE,
		ACT_END_DATE: this.ACT_END_DATE,
		ACT_DEPTNAME: this.ACT_DEPTNAME,
		ACT_LOCATION: this.ACT_LOCATION,
		ACT_LIMIT: this.ACT_LIMIT,
		ACT_URL: this.ACT_URL,
		ACT_COMM_USER: this.ACT_COMM_USER,
		ACT_COMM_TEL: this.ACT_COMM_TEL,
		ACT_COMM_EMAIL: this.ACT_COMM_EMAIL,
		ACT_B_BEG: this.ACT_B_BEG,
		ACT_B_END: this.ACT_B_END,
		ACT_K_TEL: this.ACT_K_TEL,
		ACT_K_DEPT: this.ACT_K_DEPT,
		ACT_K_OCCUP: this.ACT_K_OCCUP,
		ACT_K_IDNO: this.ACT_K_IDNO,
		ACT_K_SEX: this.ACT_K_SEX,
		ACT_K_BIRTH: this.ACT_K_BIRTH,
		ACT_K_FOOD: this.ACT_K_FOOD,
		ACT_K_SURE: this.ACT_K_SURE,
		ACT_K_ADDR: this.ACT_K_ADDR,
		ACT_IMGARR: this.ACT_IMGARR,
		ACT_LIST: this.ACT_LIST,
		ACT_NOT_SIGN: this.ACT_NOT_SIGN
	}

	let newActPost = new actPostOwnerModel(actPost);

	newActPost.save(function(err) {
		if(err){
			console.log(err);
			return cb('資料庫存取問題發生問題！！！');
		}
		else 
			return cb(null);
	});
}

//取得_id為id的文章，並且pv加一
actPost.get = function(id, callback) {
	actPostUserModel.findOne({'_id': id}, function(err, actPost) {
		if(err) {
			return callback(err);
		}
		actPostOwnerModel.update({'_id': id}, {$inc: {'pv': 1}}, function(err) {
			if(err)
				return callback(err, null);
			else 
				return callback(null, actPost);
		});
	});
}

//增加報名人數
actPost.addSingNum = function(id, callback) {
	actPostUserModel.findOne({'_id': id}, function(err, actPost) {
		if(err)
			return callback(err);
		 else 
			actPostOwnerModel.update({'_id': id}, {$inc: {'ACT_SIGN_NUM': 1}}, function(err) {
				if(err)
					return callback(err);
				else
					return callback(null);
			});
	});
}

//不會增加點閱率
actPost.take = function(id, callback) {
	actPostUserModel.findOne({'_id': id}, function(err, actPost) {
		if(err)
			return callback(err);
		else
			return callback(null, actPost);
	});
}

//全部拿取 key = null
actPost.getAll = function(callback) {
	actPostUserModel.find({}).sort('-ACT_BEG_DATE').exec(function(err, actPosts) {
		if(err)
			return callback(err, null);
		else
			return callback(null, actPosts);
	});
}

//全部拿取 key = team
actPost.getAllOfTeam = function(team, callback) {
	actPostUserModel.find({ACT_DEPTNAME: team}).sort('-ACT_C_AT').exec(function(err, actPosts) {
		if(err)
			return callback(err, null);
		else
			return callback(null, actPosts);
	});
}

//編輯 key = id
actPost.edit = function(id, actPost, callback) {
	actPostOwnerModel.update({'_id': id}, { $set: actPost }, (err) => {
		if(err)
			return callback(err, 'error');
		else
			return callback(null, 'success');
	});
}

//刪除 key = id
actPost.remove = function(id, callback) {
	actPostOwnerModel.deleteOne({'_id': id}, (err) => {
		if(err)
			return callback('error');
		else
			return callback('success');
	});
}

//限制拿取
actPost.getLimit = function(title, page, limit, callback) {
	actPostUserModel.count({}, function(err, total) {
		if(err)
			return callback(err);
		actPostUserModel.find({}, null, {skip: (page -1) * limit}).sort('-ACT_BEG_DATE').limit(limit).exec(function(err, actPosts) {
			if(err)
				return callback(err, null, null);
			else
				return callback(null, actPosts, total);
		});
	});
};

//成果分享創建 key = id
actPost.achiCreate = function(id, callback) {
	actPostOwnerModel.update({'_id': id}, { $set: { 'ACT_ACHI': true } }, (err) => {
		if(err)
			return callback(err);
		else
			return callback(null);
	});
}

//成果分享刪除 key = id
actPost.achiDelete = function(id, callback) {
	actPostOwnerModel.update({'_id': id}, { $set: { 'ACT_ACHI': false } }, (err) => {
		if(err)
			return callback(err);
		else
			return callback(null);
	});
}

//成果拿取 key = team_name achi = ture
// actPost.getAchiOfTeam = function(team, callback) {
// 	actPostOwnerModel.find({'ACT_DEPTNAME': team, 'ACT_ACHI': true}, (err, achi) => {
// 		if(err)
// 			return callback(err, null);
// 		else
// 			return callback(null, achi);
// 	});
// }

//限制拿取 // key = achi
actPost.takeAllofAchi = function(key ,callback) {
	actPostUserModel.find({ 'ACT_ACHI': key }).sort('-ACT_C_AT').exec(function(err, actPosts) {
		if(err)
			return callback(err, null);
		else
			return callback(null, actPosts);
	});
}

//限制拿取 // key = team achi
actPost.takeAllofAchiByTeam = function(team, key ,callback) {
	let date = new Date().getTime()
	actPostUserModel.find({ 'ACT_DEPTNAME': team, 'ACT_ACHI': key, 'ACT_END_DATE': {$lt: date } }).sort('-ACT_C_AT').exec(function(err, actPosts) {
		if(err)
			return callback(err, null);
		else
			return callback(null, actPosts);
	});
}

module.exports = actPost;