"use strict";
const Team = require('../models/team.js');
const actPost = require('../models/activity.js');
const Leader = require('../models/leader.js');
const actSignUp = require('../models/actSingUp.js');
const achi = require('../models/achievement.js');
const User = require('../models/user.js');
const teammate = require('../models/teammate.js');
const achiReview = require('../models/achievementReview.js');

// const fs = require('fs');
// const request = require('request');
// const open = require('open');
const multer  = require('multer');
const htmlencode = require('htmlencode');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './public/upload');
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + new Date().getTime() + '.' + file.mimetype.split('/')[1]);
	}
});

const upload = multer({ storage: storage });


module.exports = (app) => {
    //首頁
    app.get('/', (req, res) => {
        achi.getAll((err, docs) => {
            if (err)
                posts = [];

            docs.forEach((doc, index) => {
                doc.ACT_LOCATION.LOCATION_NAME = htmlencode.htmlDecode(doc.ACT_LOCATION.LOCATION_NAME);
                doc.ACT_LOCATION.LOCATION_ADDR = htmlencode.htmlDecode(doc.ACT_LOCATION.LOCATION_ADDR);
                doc.ACT_NAME = htmlencode.htmlDecode(doc.ACT_NAME);
                doc.TEAM_NAME = htmlencode.htmlDecode(doc.TEAM_NAME);
                doc.ACHI_STORE = htmlencode.htmlDecode(doc.ACHI_STORE);
            });
            return res.render('newindex', {
                title: '大學生社會責任平台',
                user: req.session.user,
                docs: docs,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    //成果列表
    app.get('/achievement', (req, res) => {
		achi.getAllAtList((err, docs) => {
            if(err) {
                req.flash('error', '伺服器異常');
                return res.redirect('/');
            } else {
                let i = 0;
                let achi = [];
                function run() {
                    if(i >= docs.length) {
                        return res.render('achievementList', {
                            title: '成果共享',
                            docs: JSON.stringify(achi),
                            user: req.session.user,
                            success: req.flash('success').toString(),
                            error: req.flash('error').toString()
                        });
                    } else {
                        Team.getIconById(docs[i].TEAM_ID, (err, icon) => {
                            if(err){
                                req.flash('error', '伺服器異常');
                                return res.redirect('/');
                            } else {
                                if(icon) {
                                    achi[i] = {
                                        _id: docs[i]._id,
                                        ACT_NAME: docs[i].ACT_NAME,
                                        ACT_LOCATION: docs[i].ACT_LOCATION,
                                        ACHI_STORE: docs[i].ACHI_STORE,
                                        teamIcon: icon.teamIcon
                                    }
                                    console.log(icon.teamIcon);
                                }
                                i++;
                                run();
                            }
                        });
                    }   
                };
                run();
            }	
		});
    });
    
    app.post('/achievement/search', (req, res) => {
        // console.log(req.body.name);
        // console.log(req.body.team);
        // console.log(req.body.place_name);
        // console.log(req.body.place_addr);
        // console.log(req.body.act_b_start);
        // console.log(req.body.act_b_end);
        // console.log(req.body.act_e_start);
        // console.log(req.body.act_e_end);

        let act_b_start = new Date(req.body.act_b_start).getTime();
        let act_b_end = new Date(req.body.act_b_end).getTime();
        let act_e_start = new Date(req.body.act_e_start).getTime();
        let act_e_end = new Date(req.body.act_e_end).getTime();

        if(isNaN(act_b_start)) {
            act_b_start = 0;
        }
        if(isNaN(act_b_end)) {
            act_b_end = new Date().getTime();
        }
        if(isNaN(act_e_start)) {
            act_e_start = 0;
        }
        if(isNaN(act_e_end)) {
            act_e_end = new Date().getTime();
        }

        let search = {
            ACT_NAME: htmlencode.htmlEncode(req.body.name),
            TEAM_NAME: htmlencode.htmlEncode(req.body.team),
            ACT_LOCATION: {
                LOCATION_NAME: req.body.place_name,
                LOCATION_ADDR: req.body.place_addr
            },
            ACT_BEG_DATE_START: act_b_start,
            ACT_BEG_DATE_END: act_b_end,
            ACT_END_DATE_START: act_e_start,
            ACT_END_DATE_END: act_e_end
        }

        achi.search(search, (err, doms) => {
            if(err) {
                req.flash('error', '伺服器異常');
                return res.redirect('/achievement');
            } else {
                return res.render('achievementList2', {
                    title: '成果查詢結果',
                    user: req.session.user,
                    doms: doms,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            }
        });
    });

    //成果單頁
    app.get('/achievement/2/:id', (req, res) => {
		achi.getById(req.params.id, (err, doc) => {
			if(err){
				req.flash('error', '伺服器異常');
				return res.redirect('/');
			} else if(!doc.length){
				req.flash('error', '無效網址');
				return res.redirect('/');
			} else {
                Team.getTeamInfoForAchi(doc[0].TEAM_ID, (err, team) => {
                    if(err) {
                        req.flash('error', '伺服器異常');
                        return res.redirect('/');
                    } else {
                        achiReview.getReviewByAchiId(req.params.id, (err, reviews) => {
                            if(err) {
                                req.flash('error', '伺服器異常');
                                return res.redirect('/achievement');
                            } else {
                                return res.render('newachievement2', {
                                    title: '成果分享',
                                    doc: doc[0],
                                    team: team,
                                    reviews: reviews,
                                    user: req.session.user,
                                    success: req.flash('success').toString(),
                                    error: req.flash('error').toString()
                                });
                            }
                        });
                    }
                });
			}
		});
    });

    app.post('/achievement/2/:id', upload.any(), (req, res) => {
        if(!req.body.title) {
            req.flash('error', '未輸入標題');
            return res.redirect('/achievement/2/' + req.params.id);
        } else if(!req.files.length) {
            req.flash('error', '未上傳照片');
            return res.redirect('/achievement/2/' + req.params.id);
        } else {
            achi.getById(req.params.id, (err, doc) => {
                if(err){
                    req.flash('error', '伺服器異常');
                    return res.redirect('/achievement');
                } else if(!doc){
                    req.flash('error', '無效網址');
                    return res.redirect('/achievement');
                } else {
                    if(req.session.user) {
                        User.getById(req.session.user._id, (err, info) => {
                            if(err) {
                                req.flash('error', '伺服器異常');
                                return res.redirect('/achievement/2/' + req.params.id);
                            } else {
                                let review = {
                                    user_name: info.NAME,
                                    title: htmlencode.htmlEncode(req.body.title),
                                    review_url: '/upload/' + req.files[0].filename,
                                    content: htmlencode.htmlEncode(req.body.content),
                                    user_id: req.session.user._id,
                                    achi_id: req.params.id
                                }
            
                                let newReview = new achiReview(review);
            
                                newReview.save((err) => {
                                    if(err) {
                                        req.flash('error', '發佈失敗');
                                        return res.redirect('/achievement/2/' + req.params.id);
                                    } else {
                                        req.flash('error', '發佈成功');
                                        return res.redirect('/achievement/2/' + req.params.id);
                                    }
                                });
                            }
                        });
                    } else {
                        let review = {
                            title: htmlencode.htmlEncode(req.body.title),
                            review_url: '/upload/' + req.files[0].filename,
                            content: htmlencode.htmlEncode(req.body.content),
                            achi_id: req.params.id
                        }
    
                        let newReview = new achiReview(review);
                        newReview.save((err) => {
                            if(err) {
                                req.flash('error', '發佈失敗');
                                return res.redirect('/achievement/2/' + req.params.id);
                            } else {
                                req.flash('error', '發佈成功');
                                return res.redirect('/achievement/2/' + req.params.id);
                            }
                        });
                    }     
                }
            });
        }
    });

    //關於我們
    app.get('/aboutUs', (req, res) => {
        res.render('aboutUs', {
            title: '關於我們',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    });

    //活動列表
    app.get('/activity', (req, res) => {
        let page = req.query.p ? parseInt(req.query.p) : 1;
        actPost.getLimit(null, page, 6, (err, posts, total) => {
            if (err)
                posts = [];

            res.render('activityList', {
                title: '活動消息',
                posts: posts,
                summary: posts.content,
                page: page,
                isFirstPage: ((page - 1) == 0),
                isLastPage: (((page - 1) * 6 + posts.length) == total),
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    //活動單頁
    app.get('/activity/:id', (req, res) => {
        actPost.get(req.params.id, (err, post) => {
            if (err) {
                console.log(err);
                return res.redirect('/');
            }
            Team.get(post.ACT_DEPTNAME, (err, team) => {
                res.render('activity', {
                    title: post.title,
                    team: team,
                    post: post,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });


    //報名
    app.get('/activity/SignUp/:id', (req, res) => {
        
        actPost.take(req.params.id, (err, post) => {
            let date = new Date();
            date = date.getTime();
            if (err) {
                console.log(err);
                return res.redirect('/');
            } else if ((post.ACT_B_BEG < date) && (post.ACT_B_END > date)) {
                res.render('activitySignUp', {
                    title: 'USR報名表單',
                    post: post,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            } else {
                req.flash('error', '非開放報名時間！！！');
                return res.redirect('/activity/' + req.params.id);
            }
        });
    });

    app.post('/activity/SignUp/:id', (req, res) => {
        actPost.take(req.params.id , function(err, actPost) {
            if (err)
                console.log(err);
            else if (actPost.ACT_B_BEG < new Date().getTime() < actPost.ACT_B_END) {
                let date = new Date().getTime();
                actSignUp.check(req.body.LIST_PER, actPost._id  , function(err, sign) {
                    if (err) {
                        console.log(err);
                        return res.redirect('/');
                    } else if (sign) {
                        req.flash('error', '重複報名！！');
                        return res.redirect('/activity/SignUp/' + req.params.id);
                    } else {
                        let activitysignUp = new actSignUp(
                            req.body.LIST_ACT_ID,
                            htmlencode.htmlEncode(req.body.LIST_KIND),
                            htmlencode.htmlEncode(req.body.LIST_PER),
                            htmlencode.htmlEncode(req.body.LIST_CNAME),
                            req.body.LIST_IDNO,
                            req.body.LIST_BIRTH,
                            req.body.LIST_TEL,
                            req.body.LIST_OCCUP,
                            req.body.LIST_SEX,
                            htmlencode.htmlEncode(req.body.LIST_ADDR)
                        )

                        activitysignUp.save((err) => {
                            if (err) {
                                console.log(err);
                                req.flash('error', err);
                                return res.redirect('/activity/SignUp/' + req.body.LIST_ACT_ID);
                            } else {
                                req.flash('success', '報名成功!!!');
                                return res.redirect('/activity/' + req.body.LIST_ACT_ID);
                            }
                        });
                    }
                });
            } else {
                req.flash('error', '非開放報名時間！！！');
                return res.redirect('/activity/' + req.params.id);
            }
        });
    });

    //團隊列表
    app.get('/team', (req, res) => {
        let page = req.query.p ? parseInt(req.query.p) : 1;

        Team.getLimit(null, page, 6, (err, teams, total) => {
            if (err) {
                teams = [];
            } else {
                return res.render('teamlist', {
                    title: '團隊介紹',
                    teams: teams,
                    page: page,
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1) * 6 + teams.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            }       
        });
    });

    //團隊單頁
    app.get('/team/:id', (req, res) => {
        Team.get(req.params.id, (err, team) => {
            if (err) {
                console.log(err);
                return res.redirect('/');
            }
            if (!team) {
                req.flash('error', '隊伍不存在');
                return res.redirect('/');
            }
            achi.getByTeam(team.name, (err, doc) => {
                if (err) {
                    return res.redirect('/');
                }
                else {
                    teammate.isTeammate(req.session.user, req.params.id, (err, key) => {
                        if(err) {
                            req.flash('error', '伺服器異常');
                            return res.redirect('/');
                        } else {
                            return res.render('team', {
                                title: team.name,
                                teams: team,
                                key: key,
                                achievement: JSON.stringify(doc),
                                user: req.session.user,
                                success: req.flash('success').toString(),
                                error: req.flash('error').toString()
                            });
                        }
                    });
                }
            });
        });
    });

    //
    //其他
    //
    app.get('/personalInfo', (req, res) => {
        res.render('personal_Info', {
            title: '個資頁面',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    //
    //測試
    //
    
    app.get('/google8f9314c57209ba21.html', (req, res) => {
        res.sendfile('views/google8f9314c57209ba21.html');
    });
}