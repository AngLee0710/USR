"use strict"
const mongoose = require('mongoose');
const dbAuth = require('./db');
const Schema = mongoose.Schema;

let actSignUpSchema = new Schema({
    LIST_ACT_ID: Schema.Types.ObjectId,
    LIST_KIND: String,
    LIST_PER: String,
    LIST_CNAME: String,
    LIST_IDNO: {type: String, default: null},
    LIST_BIRTH: {type: String, default: null},
    LIST_TEL: {type: String, default: null},
    LIST_OCCUP: {type: String, default: null},
    LIST_SEX: {type: String, default: null},
    LIST_ADDR: {type: String, default: null},
    time: Number
}, {
    collection: 'actSignUpSchema'
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

actSignUp.prototype.save = ((callback) => {
    if(!(this.LIST_ACT_ID, this.LIST_KIND, this.LIST_PER, this.LIST_CNAME, this.LIST_IDNO, this.LIST_BIRTH,
        this.LIST_TEL, this.LIST_OCCUP, this.LIST_SEX, this.LIST_ADDR))
        return callback('資料不齊全');
    
    let date = new Date();
    let time = date.getTime();

    let actSignUp = {
        LIST_ACT_ID: this.LIST_ACT_ID,
        LIST_KIND: this.LIST_KIND,
        LIST_PER: this.LIST_PER,
        LIST_CNAME: this.LIST_CNAME,
        LIST_IDNO: this.LIST_IDNO,
        LIST_BIRTH: this.LIST_BIRTH,
        LIST_TEL: this.LIST_TEL,
        LIST_OCCUP: this.LIST_OCCUP,
        LIST_SEX: this.LIST_SEX,
        LIST_ADDR: this.LIST_ADDR
    }

    let newActSignUp = new actSignUpOwnerModel(actSignUp);

    newActSignUp.save((err) => {
        if(err)
            return callback(err);
        else
            return callback(null);
    });
});