"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const htmlencode = require('htmlencode');
const activity = require('./activity');
const Schema = mongoose.Schema;



let actSignUpSchema = new Schema({
    LIST_ACT_ID: String,
    LIST_PER: {type: String},
    LIST_KIND: String,
    LIST_CNAME: String,
    LIST_IDNO: {type: String, default: null},
    LIST_BIRTH: {type: String, default: null},
    LIST_TEL: {type: String, default: null},
    LIST_OCCUP: {type: String, default: null},
    LIST_SEX: {type: String, default: null},
    LIST_ADDR: {type: String, default: null},
    time: Number,
    DELETE: { type: Boolean, default: false }
}, {
    collection: 'actSignUp'
});

let actSignUpOwnerModel = dbAuth.owner.model('actSignUp', actSignUpSchema);
let actSignUpUserModel = dbAuth.user.model('actSignUp', actSignUpSchema);

function actSignUp(LIST_ACT_ID, LIST_KIND, LIST_PER, LIST_CNAME, LIST_IDNO, LIST_BIRTH,
    LIST_TEL, LIST_OCCUP, LIST_SEX, LIST_ADDR) {
        this.LIST_ACT_ID = LIST_ACT_ID;
        this.LIST_KIND = LIST_KIND;
        this.LIST_PER = LIST_PER;
        this.LIST_CNAME = LIST_CNAME;
        this.LIST_IDNO = LIST_IDNO;
        this.LIST_BIRTH = LIST_BIRTH;
        this.LIST_TEL = LIST_TEL;
        this.LIST_OCCUP = LIST_OCCUP;
        this.LIST_SEX = LIST_SEX;
        this.LIST_ADDR = LIST_ADDR;
    }

actSignUp.prototype.save = function(callback) {
    if(!(this.LIST_ACT_ID))
        return callback('未輸入ID');
    else if(!(this.LIST_KIND))
        return callback('未輸入身分');
    else if(!(this.LIST_PER))
        return callback('未輸入學號/教職編號/信箱');
    else if(!(this.LIST_CNAME))
        return callback('未輸入姓名');
    
    let date = new Date();
    let time = date.getTime();

    let actSignUp = {
        LIST_ACT_ID: this.LIST_ACT_ID,
        LIST_PER: this.LIST_PER,
        LIST_KIND: this.LIST_KIND,
        LIST_CNAME: this.LIST_CNAME,
        LIST_IDNO: this.LIST_IDNO,
        LIST_BIRTH: this.LIST_BIRTH,
        LIST_TEL: this.LIST_TEL,
        LIST_OCCUP: this.LIST_OCCUP,
        LIST_SEX: this.LIST_SEX,
        LIST_ADDR: this.LIST_ADDR,
        time: time
    }

    let newActSignUp = new actSignUpOwnerModel(actSignUp);

    newActSignUp.save((err) => {
        if(err)
            return callback(err);
        else {
            activity.addSingNum(actSignUp.LIST_ACT_ID, (err)=> {
                if(err){
                    console.log(err);
                    return cb('資料庫存取問題發生問題！！！');
                } else 
                    return callback(null);
            });
        }
    });
}

actSignUp.check = function(per, act_id, callback) {
    actSignUpUserModel.findOne({LIST_PER: per, LIST_ACT_ID: act_id}, function(err, sign) {
        if(err)
            return callback(err);
        else if(sign){
            return callback(null, true);
        }else {
            return callback(null);
        }
    });
}

module.exports = actSignUp;