"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema; 

let teammateSchema = new Schema({
	TEAM_ID: { type: String },
	MEMBER_ID: { type: String },
	C_T: { type: Number, default: Date.now },
    PERMISSION: { type: Number, default: 3 },
    ACTs: [ { id: String } ],
	ACHIs: [ { ACHIID: String } ],
	DELETE: { type: Boolean, default: false }
}, {
	collection: 'teammate'
});

let teammateOwnerModel = dbAuth.owner.model('teammate', teammateSchema);
let teammateUserModel = dbAuth.user.model('teammate', teammateSchema);

function teammate(teammate) {
	this.team_id = teammate.team_id;
	this.member_id = teammate.member_id;
	this.permission = teammate.permission;
}

teammate.prototype.save = function(cb) {
	let teammate = {
		TEAM_ID: this.team_id,
		MEMBER_ID: this.member_id,
		PERMISSION: this.permission
	};

	let newTeammate = new teammateOwnerModel(teammate);

	newTeammate.save(function(err) {
		if(err){
			console.log(err);
			return cb('資料庫存取問題發生問題！！！');
		}
		 else
			return cb(null);
	});
}

//根據使用者ID顯示隊伍
teammate.getTeamIdByUserId = function(user, cb) {
	teammateUserModel.find( {'MEMBER_ID': user, 'DELETE': false ,'PERMISSION': { $lte: 2 }}, {'TEAM_ID' : 1} ).sort('C_T').exec((err, teamsID) => {
		if(err) {
			console.log(err);
			return cb(err, null);
		} else {
			return cb(null, teamsID);
		}
	});
}

//獲得全部隊員名單
teammate.getAllTeammate  = function(team, cb) {
	teammateUserModel.find( {'TEAM_ID': team}, {'PERMISSION': 1, 'MEMBER_ID': 1}, (err, teammate) => {
		if(err) {
			return cb(err, null);
		} else {
			return cb(null, teammate);
		}
	});
}

//查看user是否存在隊伍
teammate.isTeammate = function(user, team, cb) {
	teammateUserModel.findOne( {'MEMBER_ID': user, 'TEAM_ID': team}, (err, teammate) => {
		if(err) {
			return cb(err, null);
		} else {
			return cb(null, teammate);
		}
	});
}

//確認是否為最高權限
teammate.isSupreme = function(user, team, cb) {
	teammateUserModel.findOne( {'MEMBER_ID': user, 'TEAM_ID': team}, {'PERMISSION' : 1}, (err, permission) => {
		if(err) {
			return cb(err, null);
		} else {
			return cb(null, (permission.PERMISSION == 1));
		}
	});
}

//確認是否為管理權限
teammate.isManager = function(user, team, cb) {
	teammateUserModel.findOne( {'MEMBER_ID': user, 'TEAM_ID': team}, {'PERMISSION' : 1}, (err, permission) => {
		if(err) {
			return cb(err, null);
		} else {
			return cb(null, (permission.PERMISSION <= 2) );
		}
	});
}

//刪除隊伍時，刪除隊伍內所有隊員
teammate.removeAllTeammate = function(team, users, cb) {
	teammateOwnerModel.update({ 'TEAM_ID': team, 'MEMBER_ID': users }, {$set:{'DELETE': true}}, (err) => {
		if(err) {
			console.log(err);
			return cb(err, 'error');
		} else {
			return cb(null, 'success');
		}
	});
}

//給予管理權限
teammate.giveManage = function(user, team, cb) {
	teammateOwnerModel.update({'MEMBER_ID': user, 'TEAM_ID': team}, {$set: { 'PERMISSION' : 2 }}, (err, key) => {
		if(err) {
			return cb(err, null)
		} else {
			return cb(null, 'success');
		}
	});
}

//降為一般會員
teammate.giveNormal = function(user, team, cb) {
	teammateOwnerModel.update({'MEMBER_ID': user, 'TEAM_ID': team}, {$set: { 'PERMISSION' : 3 }}, (err, key) => {
		if(err) {
			return cb(err, null)
		} else {
			return cb(null, 'success');
		}
	});
}

//最高權限轉移
teammate.turnSupreme = function(user, team, cb) {
	teammateOwnerModel.update({'MEMBER_ID': user, 'TEAM_ID': team}, {$set: { 'PERMISSION' : 1 }}, (err, key) => {
		if(err) {
			return cb(err, null)
		} else {
			return cb(null, 'success');
		}
	});
}

module.exports = teammate