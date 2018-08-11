"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema; 

let reviewSchema = new Schema({
    ACHI_ID: { type: String },
    USER_ID: {type: String, default: null},
    USER_NAME: { type: String },
    REVIEW_IMG_URL: { type: String },
    TITLE: { type: String },
    CONTENT: { type: String },
    EMOTION: { type: String },
    A_T: { type: String, default: Date.now}
}, {
	collection: 'achievementReview'
});

let achievementReviewOwnerModel = dbAuth.owner.model('achievementReview', reviewSchema);
let achievementReviewUserModel = dbAuth.user.model('achievementReview', reviewSchema);

function achievementReview(review) {
    this.content = review.content;
    this.emotion = review.emotion;
    this.review_url = review.review_url;
    this.user_id = review.user_id;
    this.achi_id = review.achi_id;
    this.title = review.title;
    this.user_name = review.user_name;
}

achievementReview.prototype.save = function(cb) {
	let review = {
		ACHI_ID: this.achi_id,
        USER_ID: this.user_id,
        USER_NAME: this.user_name,
        REVIEW_IMG_URL: this.review_url,
        CONTENT: this.content,
        EMOTION: this.emotion,
        TITLE: this.title
	};

	let newReview = new achievementReviewOwnerModel(review);

	newReview.save(function(err) {
		if(err){
			console.log(err);
			return cb('資料庫存取問題發生問題！！！');
		}
		 else
			return cb(null);
	});
}

achievementReview.getReviewByAchiId = function(id, cb) {
    achievementReviewUserModel.find({'ACHI_ID': id}, (err, docs) => {
        if(err) {
            return cb(err, null);
        } else {
            return cb(null, docs);
        }
    });
}

module.exports = achievementReview;