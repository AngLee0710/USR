"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema;

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
		phone: String
	},
	teamImg: String,
	teamLogo: String,
	teamIcon: String,
	achievement: [{title: String, date: String}],
	pv: {type: Number, default: 1},
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
	this.teamImg = team.teamImg;
	this.teamLogo = team.teamLogo;
	this.teamIcon = team.teamIcon;
}

Team.prototype.save = function(cb) {
	if(!this.name)
		return cb('未輸入團隊名稱');
	else if(!this.leader)
		return cb('未輸入領導人');
	else if(!this.purpose)
		return cb('未輸入團隊宗旨');
	else if(!this.introduction)
		return cb('未輸入團隊介紹');
	else if(!this.pro_introduction)
		return cb('未輸入團隊專業介紹');
	else if(!this.connection.name)
		return cb('未輸入聯絡人姓名');
	else if(!this.connection.email)
		return cb('未輸入聯絡人信箱');
	else if(!this.connection.phone)
		return cb('未輸入聯絡人電話');

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
		teamImg: this.teamImg,
		teamLogo: this.teamLogo,
		teamIcon: this.teamIcon,
	};

	let newTeam = new teamOwnerModel(team);

	newTeam.save(function(err) {
		if(err){
			console.log(err);
			return cb('資料庫存取問題發生問題！！！');
		}
		 else {
			return cb(null, team);
		 }
	});
}

Team.check = function(name,callback) {
	teamUserModel.findOne({name: name}, function(err, team) {
		if(err)
			return callback(err, null);
		else
			return callback(null, team);
	});
}

//檢查隊伍是否存在
Team.checkById = function(id, callback) {
	teamUserModel.findOne({'_id': id}, {'name': 1, 'connection': 1}, function(err, team) {
		if(err)
			return callback(err, null);
		else
			return callback(null, team);
	});
}

Team.get = function(id, callback) {
	teamUserModel.findOne({_id: id}, function(err, team) {
		if(err)
			return callback(err);
		else
			teamOwnerModel.update({_id: id}, {$inc: {pv: 1}}, function(err) {
				if(err)
					return callback(err, null);
				else
					return callback(null, team);
			});
	});
}

Team.take = function(id, callback) {
	teamUserModel.findOne({_id: id}, function(err, team) {
		if(err)
			return callback(err, null);
		else
			return callback(null, team);
	});
}

Team.edit = function(id, team, callback) {
	if(!team.name)
		return callback('未輸入團隊名稱');
	else if(!team.leader)
		return callback('未輸入領導人');
	else if(!team.purpose)
		return callback('未輸入團隊宗旨');
	else if(!team.introduction)
		return callback('未輸入團隊介紹');
	else if(!team.pro_introduction)
		return callback('未輸入團隊專業介紹');
	else if(!team.connection.name)
		return callback('未輸入聯絡人姓名');
	else if(!team.connection.email)
		return callback('未輸入聯絡人信箱');
	else if(!team.connection.phone)
		return callback('未輸入聯絡人電話');
	else {
		teamOwnerModel.update({'_id': id}, { $set: team }, (err, a) => {
			if(err) 
				return callback(err, 'error');
			else
				return callback(null, 'success');
		});
	}
}

Team.remove = function(id, callback) {
	teamOwnerModel.deleteOne({'_id': id}, (err) => {
		if(err)
			return callback('error');
		else
			return callback('success');
	});
}

Team.getAll = function(callback) {
	teamUserModel.find({},(err, team) => {
		if(err)
			return callback(err, null);
		else
			return callback(null, team);
	})
}

Team.getLimit = function(name, page, limit, callback) {
	teamUserModel.count({}, function(err, total) {
		if(err)
			return callback(err);
		else
			teamUserModel.find({}, null, {skip: (page -1) * limit}).sort('-time').limit(limit).exec(function(err, actPosts) {
				if(err)
					return callback(err, null, null);
				else
					return callback(null, actPosts, total);
			});
	});
}

//給隊伍管理頁面使用
Team.getByIdForManage = function(id, callback) {
	teamUserModel.findOne( { '_id': id }, { '_id': 1, 'name': 1, 'leader': 1 }, function(err, team) {
		if(err)
			return callback(err, null);
		else {
			return callback(null, team);
		}
	});
}

//給成員管理頁面使用
Team.getByIdForMember = function(id, callback) {
	teamUserModel.findOne( { '_id': id }, { '_id': 1, 'name': 1 }, function(err, team) {
		if(err)
			return callback(err, null);
		else {
			return callback(null, team);
		}
	});
}

//用隊名取得ID
Team.getIdByTeamName = function(name, callback) {
	teamUserModel.findOne( { 'name': name }, { '_id': 1 }, function(err, team) {
		if(err)
			return callback(err, null);
		else
			return callback(null, team);
	});
}

//用ID取得隊名
Team.getNameById = function(id, callback) {
	teamUserModel.findOne( { '_id': id }, { 'name': 1 }, function(err, team) {
		if(err)
			return callback(err, null);
		else
			return callback(null, team);
	});
}

//成果共享單頁隊伍資訊
Team.getTeamInfoForAchi = function(id, callback) {
	teamUserModel.findOne( { '_id': id }, { 'name': 1, 'teamLogo': 1 }, function(err, team) {
		if(err)
			return callback(err, null);
		else
			return callback(null, team);
	});
}

//用id取得logo
Team.getLogoById = function(id, callback) {
	teamUserModel.findOne( { '_id': id }, { 'teamLogo': 1 }, function(err, logo) {
		if(err)
			return callback(err, null);
		else
			return callback(null, logo);
	});
}


module.exports = Team;