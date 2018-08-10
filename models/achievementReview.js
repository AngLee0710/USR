"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema; 

let reviewSchema = new Schema({
    ACHI_ID: String,
    USER_ID: String,
    REVIEW_URL: String,
    CONTENT: String,
    EMOTION: { type: String, default: 'normal' },
    TITLE: String,
}, {
	collection: 'achievementReview'
});

let achievementReviewOwnerModel = dbAuth.owner.model('achievementReview', reviewSchema);
let achievementReviewUserModel = dbAuth.user.model('achievementReview', reviewSchema);

function achievementReview(review) {
    this.title = review.title;
    this.content = review.content;
    this.emotion = review.emotion;
    this.review_url = review.review_url;
    this.user_id = review.user_id;
    this.achi_id = review.achi_id;

}

teammateReview.prototype.save = function(cb) {
	let review = {
		ACHI_ID: this.achi_id,
        USER_ID: this.user_id,
        REVIEW_URL: this.review_url,
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


module.exports = achievementReview;