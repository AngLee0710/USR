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
	ACT_LOCATION: String,
	ACT_LIMIT: {type: Number, default: 9999},
	ACT_LIMIT_R: {type: String, default: 'O'},
	ACT_LIMIT_SEX: {type: String, default: 'N'},
	ACT_URL: String,
	ACT_COMM_USER: String,
	ACT_COMM_TEL: String,
	ACT_COMM_EMAIL: String,
	ACT_FLAG: {type: String, default: 'Y'},
	ACT_B_BEG: String,
	ACT_B_END: String,
	ACT_C_AT: String,
	ACT_U_AT: String,
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
	time: Number,
	pv: Number
}, {
	collection: 'actPosts'
});

let actPostOwnerModel = dbAuth.owner.model('actPost', actPostSchema);
let actPostUserModel = dbAuth.user.model('actPost', actPostSchema);


function actPost(ACT_SUBJ_NAME, ACT_BEG_DATE, ACT_END_DATE, ACT_DEPTNAME, ACT_LOCATION, ACT_LIMIT_SEX, 
	ACT_LIMIT, ACT_URL, ACT_COMM_USER, ACT_COMM_TEL, ACT_COMM_EMAIL, ACT_B_BEG, ACT_B_END,
	ACT_K_TEL, ACT_K_DEPT, ACT_K_OCCUP, ACT_K_IDNO, ACT_K_SEX, ACT_K_BIRTH, ACT_K_FOOD, 
	ACT_K_ADDR, ACT_LIST, ACT_IMGARR) {
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
}

actPost.prototype.save = function(callback) {
	if(!(this.ACT_SUBJ_NAME && this.ACT_END_DATE && this.ACT_DEPTNAME && this.ACT_LOCATION
	&& this.ACT_LIMIT && this.ACT_URL && this.ACT_COMM_USER && this.ACT_COMM_TEL && this.ACT_COMM_EMAIL
	&& this.ACT_B_BEG  && this.ACT_B_END && this.ACT_C_AT && this.ACT_K_TEL && this.ACT_K_DEPT
	&& this.ACT_K_OCCUP && this.ACT_K_IDNO && this.ACT_K_SEX && this.ACT_K_BIRTH && this.ACT_K_FOOD
	&& this.ACT_K_SUR && this.ACT_K_ADDR, this.ACT_BEG_DATE)) {
		return callback('資料不齊全');
	}

	let date = new Date();
	let time = date.getTime();

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
		ACT_C_AT: this.ACT_C_AT,
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
		time: time,
		pv: 1
	}

	let newActPost = new actPostOwnerModel(actPost);

	newActPost.save(function(err) {
		if(err) {
			return callback(err);
		}
		callback(null);
	});
}

actPost.get = function(id, callback) {
	actPostUserModel.findOne({'_id': id}, function(err, actPost) {
		if(err) {
			return callback(err);
		}
		actPostOwnerModel.update({'_id': id}, {$inc: {'pv': 1}}, function(err) {
			if(err) {
				return callback(err);
			}
		});
		callback(null, actPost);
	});
}

actPost.tack = function(id, callback) {
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
	actPostOwnerModel.update({'_id': id}, { $set: actPost }, (err) => {
		if(err) {
			console.log(err);
			return callback(err, 'error');
		}
		return callback(null, 'success');
	});
}

actPost.remove = function(id, callback) {
	actPostOwnerModel.deleteOne({'_id': id}, (err) => {
		if(err) {
			console.log(err);
			return callback('error');
		}else
			return callback('success');
	});
}

actPost.getLimit = function(title, page, limit, callback) {
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
};

module.exports = actPost;