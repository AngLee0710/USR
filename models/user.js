"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema; 


let userSchema = new Schema({
	NFUID: { type: String, default: null },
	NAME: { type: String },
	EMAIL: { type: String, default: null, index: { unique: true } },
	PHOTO: { type: String },
	PHONE: { type: String, default: null},
	BIRTHDAY: { type: Number, default: null },
	FAMILY_NAME: { type: String, default: null },
	GIVEN_NAME: { type: String, default: null },
	ADDR: { type: String, default: null },
}, {
	collection: 'users'
});

let userOwnerModel = dbAuth.owner.model('User', userSchema);
let userUserModel = dbAuth.user.model('User', userSchema);

function User(user) {
	this.nfuid = user.nfuid;
	this.name = user.name;
	this.email = user.email;
	this.photo = user.photo;
	this.phone = user.phone;
	this.birthday = user.birthday;
	this.family_name = user.family_name;
	this.given_name = user.given_name;
	this.addr = user.addr;
}

User.prototype.save = function(callback) {
	let user = {
		NFUID: this.nfuid,
		NAME: this.name,
		EMAIL: this.email,
		PHOTO: this.photo,
		BIRTHDAY: this.birthday,
		FAMILY_NAME: this.family_name,
		GIVEN_NAME: this.given_name,
		PHONE: this.phone,
		ADDR: this.addr
	}

	let newUser = new userOwnerModel(user);

	newUser.save(function(err, user) {
		if(err) {
			return callback(err);
		}
		return callback(null, user);
	});
}

//檢查信箱是否存在
User.getByEmail = function(email, callback) {
	if(email) {
		userUserModel.findOne({'EMAIL': email}, {'EMAIL': 1}, function(err, user) {
			if(err) {
				return callback(err);
			}
			return callback(null, user);
		});
	} else {
		return callback(null, null);
	}
}

//用id拿取個人資訊
User.getById = function(id, callback) {
	userUserModel.findOne({_id: id}, function(err, user) {
		if(err) {
			return callback(err, null);
		} else {
			return callback(null, user);
		}
	});
}

//修改個人資訊
User.edit = function(id, edit, callback) {
	userOwnerModel.update({'_id': id}, { $set: edit }, (err) => {
		if(err) {
			return callback(err, null)
		} else {
			return callback(null, 'success');
		}
	});
}

//用id拿取資訊給Review
User.getInfoByIdToReview = function(id, callback) {
		userUserModel.findOne({ '_id': id }, { '_id': 1, 'NAME': 1, 'EMAIL': 1, 'PHOTO': 1 }, function(err, user) {
			if(err) {
				return callback(err, null);
			} else {
				return callback(null, user);
			}
	});
}

//用id取得名字大頭貼信箱
User.getNamePhotoEmailById = function(id , callback) {
	userUserModel.findOne({_id: id}, {'NAME': 1, 'PHOTO': 1, 'EMAIL': 1}, function(err, user) {
		if(err) {
			return callback(err, null);
		} else {
			return callback(null, user);
		}
	});
}

module.exports = User;
