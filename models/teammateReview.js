"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema; 

let reviewSchema = new Schema({
	TEAM_ID: { type: String },
	MEMBER_ID: { type: String },
	C_T: { type: Number },
	STATE: { type: Number, default: 0 }
}, {
	collection: 'teammateReview'
});

let teammateReviewOwnerModel = dbAuth.owner.model('teammateReview', reviewSchema);
let teammateReviewUserModel = dbAuth.user.model('teammateReview', reviewSchema);

function teammateReview(review) {
	this.team_id = review.team_id;
	this.member_id = review.member_id;
	this.c_t = new Date().getTime();
	this.state = 0;
}

teammateReview.prototype.save = function(cb) {
	let review = {
		TEAM_ID: this.team_id,
		MEMBER_ID: this.member_id,
		C_T: this.c_t,
		STATE: this.state
	};

	let newReview = new teammateReviewOwnerModel(review);

	newReview.save(function(err) {
		if(err){
			console.log(err);
			return cb('資料庫存取問題發生問題！！！');
		}
		 else
			return cb(null);
	});
}

teammateReview.check = function(team, member, cb) {
	console.log(team);
	console.log(member);
	teammateReviewUserModel.findOne( {'TEAM_ID': team, 'MEMBER_ID': member}, (err, review) => {
		if(err) {
			console.log(err);
			return cb(err, null);
		} else {
			return cb(null, review);
		}
	});
}

//查看該團隊未審核名單
teammateReview.getAllReviewNotYet = function(team, cb) {
	teammateReviewUserModel.find( { 'TEAM_ID': team, 'STATE': 0 }, (err, reviews) => {
		if(err) {
			console.log(err);
			return cb(err, null);
		} else {
			return cb(null, reviews);
		}
	});
}

//審核通過
teammateReview.allow = function(id, cb) {
	teammateReviewOwnerModel.update( { '_id': id }, { $set: { 'STATE': 2 } }, (err, reviews) => {
		if(err) {
			console.log(err);
			return cb(err, null);
		} else {
			return cb(null, reviews);
		}
	});
}

//審核未通過
teammateReview.deny = function(id, cb) {
	teammateReviewOwnerModel.deleteOne( { '_id': id }, (err, reviews) => {
		if(err) {
			console.log(err);
			return cb(err, null);
		} else {
			return cb(null, reviews);
		}
	});
}

teammateReview.getInfoById = function(id, cb) {
	teammateReviewUserModel.findOne( {'_id': id}, (err, reviews) => {
		if(err) {
			console.log(err);
			return cb(err, null);
		} else {
			return cb(null, reviews);
		}
	});
}

module.exports = teammateReview;