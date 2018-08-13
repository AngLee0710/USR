"use strict";
const crypto = require('crypto');
const multer  = require('multer');
const fs = require('fs');
const cheerio = require('cheerio');
const htmlencode = require('htmlencode');
const request = require('request');
const async = require('async');

const User = require('../models/user.js');
const Team = require('../models/team.js');
const actPost = require('../models/activity.js');
const Leader = require('../models/leader.js');
const achi = require('../models/achievement.js');
const teammateReview = require('../models/teammateReview.js');
const teammate = require('../models/teammate.js');
const achiReview = require('../models/achievementReview.js');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './public/upload')
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + new Date().getTime() + '.' + file.mimetype.split('/')[1]);
	}
});

const upload = multer({ storage: storage });

module.exports =  (app) => {
	//
	//使用者權限
	//
	app.get('/admin', checkLogin);
	app.get('/admin', (req, res) => {
		res.redirect('/teamManage');
	});

	app.get('/google/login', checkNotLogin);
	app.get('/google/login', (req, res) => {
        let googleOauthUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + 
        "scope=https://www.googleapis.com/auth/userinfo.email&"+
        "redirect_uri=http://localhost:3000/google/callback&"+
        "response_type=code&"+
        "client_id=" + process.env.googleID;
        return res.redirect(googleOauthUrl);
        //res.send(JSON.stringify({"redirect_url":googleOauthUrl}));
    });

	app.get('/google/callback', checkNotLogin);
    app.get('/google/callback', function(req, res) {
        var code = req.query.code;
        //拿code換token
        var token_option = {
            url:"https://www.googleapis.com/oauth2/v4/token",
            method:"POST",
            // headers: {
            //     "Content-Type": "application/x-www-form-urlencoded"
            // },
            form:{
                code: code,
                client_id: process.env.googleID,
                client_secret: process.env.googleKEY,
                grant_type:"authorization_code",
                //要跟Google Console裡填的一樣喔
                redirect_uri:"http://localhost:3000/google/callback"
            }
        };
        request(token_option, function(err, resposne, body) {
			var access_token = JSON.parse(body).access_token;
            var info_option = {
                url:"https://www.googleapis.com/oauth2/v1/userinfo?"+"access_token="+access_token,
                method:"GET",
            };
            request(info_option, function(err, response, body){
                if(err){
                    res.send(err);
                } else {
					let gmailInfo = JSON.parse(body);
                    User.getByEmail(gmailInfo.email, (err, user) => {
                        if(err) {
                            req.flash('error', '登入失敗');
                            return res.redirect('/');
                        } else if(!user) {
                            let newUser = new User({
                                name: htmlencode.htmlEncode(gmailInfo.name),
								email: gmailInfo.email,
								photo: gmailInfo.picture,
								family_name: htmlencode.htmlEncode(gmailInfo.family_name),
								given_name: htmlencode.htmlEncode(gmailInfo.given_name)
                            })

                            newUser.save((err, user) => {
                                if(err) {
                                    req.flash('error', '登入失敗');
                                    return res.redirect('/');
                                } else {
                                    req.session.user = user;
                                    return res.redirect('/');
                                }
                            })
                        } else if(user) {
							req.flash('success', '登入成功');
							req.session.user = user;
							return res.redirect('/');
						}
                    });
                }
            });
        })
    });

	app.get('/logout', checkLogin);
	app.get('/logout', (req, res) => {
		req.session.user = null;
		return res.redirect('/');
	});

	//
	//活動
	//
	app.get('/activityManageAll', checkLogin);
	app.get('/activityManageAll', (req, res) => {
		actPost.getAll((err, posts) => {
			if(err) {
				console.log(err);
				return res.redirect('/');
			} else {
				Team.getAll((err, teams) => {
					if(err) {
						console.log(err);
						return res.redirect('/');
					} else {
						
						res.render('activityManage', {
							title: '活動管理',
							user: req.session.user,
							posts: JSON.stringify(posts),
							teams: teams,
							success: req.flash('success').toString(),
							error: req.flash('error').toString()
						});
					}
				});
			}
		});
	});

	app.get('/activityManage', checkLogin);
	app.get('/activityManage', (req, res) => {
		teammate.getTeamIdByUserId(req.session.user._id, (err, teams) => {
			if(err) {
				req.flash('error', '伺服器異常');
				return res.redirect('/');
			} else {
				let actList = [];
				let teamList = [];
				let j = 0;
				let i = 0;
				function run() {
					if(i >= teams.length ) {
						return res.render('activityManage', {
							title: '活動管理',
							user: req.session.user,
							posts: JSON.stringify(actList),
							teams: teamList,
							success: req.flash('success').toString(),
							error: req.flash('error').toString()
						});
					} else {
						actPost.getAllOfTeamForManage(teams[i].TEAM_ID, (err, acts) => {
							if(err) {
								req.flash('error', '伺服器異常');
								return res.redirect('/');
							} else {
								Team.getNameById(teams[i].TEAM_ID, (err , team) => {
									if(err) {
										req.flash('error', '伺服器異常');
										return res.redirect('/');
									} else {
										teamList[i] = team;
										let k = 0;
										function run2() {
											if( k >= acts.length) {
												i++;
												run();
											} else {
												actList[j] = acts[k];
												k++;
												j++;
												run2();
											}
										}
										run2();
									}
								});
							}
						});
						
					}		
				}
				run();
				
			}
		});
	});

	app.post('/activity/create', checkLogin);
	app.post('/activity/create', (req, res) => {
		let $ = cheerio.load(req.body.ACT_LIST);
		let imgArray = [];
		for(let i = 0 ; i < $('img').length ; i++) {
			imgArray[i] = {
				url: $('img')[i].attribs.src
			}
		}
	
		Team.checkById(req.body.ACT_DEPTNAME, (err, team) => {
			if(err) {
				console.log(err);
				req.flash('error', '伺服器異常!!');
				return res.redirect('/');				 
			} else if(!team) {
				req.flash('error', '找不到隊伍');
				return res.redirect('/activityManage');	
			} else {
				let ACT_BEG_DATE = req.body.ACT_BEG_DATE_D + ' ' + req.body.ACT_BEG_DATE_T;
				let ACT_END_DATE = req.body.ACT_END_DATE_D + ' ' + req.body.ACT_END_DATE_T;
				let ACT_B_BEG = req.body.ACT_B_BEG_D + ' ' + req.body.ACT_B_BEG_T;
				let ACT_B_END = req.body.ACT_B_END_D + ' ' + req.body.ACT_B_END_T;
				let ACT_COMM_USER = team.connection.name;
				let ACT_COMM_TEL = team.connection.phone;
				let ACT_COMM_EMAIL = team.connection.email;
				let ACT_LOCATION = {
					LOCATION_NAME: req.body.ACT_LOCATION_NAME,
					LOCATION_ADDR: req.body.ACT_LOCATION_ADDR,
					LOCATION_LAT: req.body.ACT_LOCATION_LAT,
					LOCATION_LNG: req.body.ACT_LOCATION_LNG
				}

				let ACT_BEG_DATE_POCH = Date.parse(ACT_BEG_DATE),
					ACT_END_DATE_POCH = Date.parse(ACT_END_DATE),
					ACT_B_BEG_POCH = Date.parse(ACT_B_BEG),
					ACT_B_END_POCH = Date.parse(ACT_B_END),
					ACT_NOT_SIGN = true;

				if(!req.body.ACT_CHECK) {
					ACT_B_BEG_POCH = 1;
					ACT_B_END_POCH = 1;
					req.body.ACT_LIMIT = 1;
					ACT_NOT_SIGN = false;
				}
				
				let activityPost = new actPost(
					htmlencode.htmlEncode(req.body.ACT_SUBJ_NAME),
					ACT_BEG_DATE_POCH,
					ACT_END_DATE_POCH,
					team.name,
					ACT_LOCATION,
					htmlencode.htmlEncode(req.body.ACT_LIMIT_SEX),
					req.body.ACT_LIMIT,
					htmlencode.htmlEncode(req.body.ACT_URL),
					ACT_COMM_USER,
					ACT_COMM_TEL,
					ACT_COMM_EMAIL,			
					ACT_B_BEG_POCH,
					ACT_B_END_POCH,
					htmlencode.htmlEncode(req.body.ACT_K_TEL),
					htmlencode.htmlEncode(req.body.ACT_K_DEPT),
					htmlencode.htmlEncode(req.body.ACT_K_OCCUP),
					htmlencode.htmlEncode(req.body.ACT_K_IDNO),
					htmlencode.htmlEncode(req.body.ACT_K_SEX),
					htmlencode.htmlEncode(req.body.ACT_K_BIRTH),
					htmlencode.htmlEncode(req.body.ACT_K_FOOD),
					htmlencode.htmlEncode(req.body.ACT_K_ADDR),
					req.body.ACT_LIST,
					imgArray,
					ACT_NOT_SIGN,
					team._id
				);

				activityPost.save((err) => {
					if(err) {
						req.flash('error', err);
						return res.redirect('/activityManage');
					} else {
						req.flash('success', '活動發佈成功');
						return res.redirect('/activityManage');
					}
				});
			}
		});
	});

	app.post('/activity/get', checkLogin);
	app.post('/activity/get', (req, res) => {
		actPost.take(req.body.data, (err, actPost) => {
			if(err){
				console.log(err);
				return res.redirect('/activityManage');
			} else {
				actPost.ACT_LOCATION.LOCATION_NAME = htmlencode.htmlDecode(actPost.ACT_LOCATION.LOCATION_NAME);
				actPost.ACT_LOCATION.LOCATION_ADDR = htmlencode.htmlDecode(actPost.ACT_LOCATION.LOCATION_ADDR);
				actPost.ACT_SUBJ_NAME = htmlencode.htmlDecode(actPost.ACT_SUBJ_NAME);
				actPost.ACT_LIST = htmlencode.htmlDecode(actPost.ACT_LIST);
				actPost.ACT_DEPTNAME = htmlencode.htmlDecode(actPost.ACT_DEPTNAME);
				actPost.ACT_URL = htmlencode.htmlDecode(actPost.ACT_URL);
				res.send(actPost);
			}
		});
	});

	app.post('/activity/edit', checkLogin);
	app.post('/activity/edit', (req, res) => {
		let $ = cheerio.load(req.body.ACT_LIST);
		let imgArray = [];

		for(let i = 0 ; i < $('img').length ; i++) {
			imgArray[i] = {
				url: $('img')[i].attribs.src
			}
		}

		let ACT_BEG_DATE = req.body.ACT_BEG_DATE_D + ' ' + req.body.ACT_BEG_DATE_T;
		let ACT_END_DATE = req.body.ACT_END_DATE_D + ' '	+ req.body.ACT_END_DATE_T;
		let ACT_B_BEG = req.body.ACT_B_BEG_D + ' ' + req.body.ACT_B_BEG_T;
		let ACT_B_END = req.body.ACT_B_END_D + ' ' + req.body.ACT_B_END_T;
		let ACT_BEG_DATE_POCH = Date.parse(ACT_BEG_DATE),
			ACT_END_DATE_POCH = Date.parse(ACT_END_DATE),
			ACT_B_BEG_POCH = Date.parse(ACT_B_BEG),
			ACT_B_END_POCH = Date.parse(ACT_B_END);
		let ACT_NOT_SING = req.body.ACT_NOT_SING;
		let ACT_LOCATION = {
			LOCATION_NAME: htmlencode.htmlEncode(req.body.ACT_LOCATION_NAME),
			LOCATION_ADDR: htmlencode.htmlEncode(req.body.ACT_LOCATION_ADDR),
			LOCATION_LAT: req.body.ACT_LOCATION_LNG,
			LOCATION_LNG: req.body.ACT_LOCATION_LAT
		}
		
		Team.checkById(req.body.ACT_DEPTNAME, (err, team) => {
			if(err) {
				console.log(err);
				return res.redirect('/activityManage');
			} else {
				console.log(team);
				let ACT_COMM_USER = team.connection.name;
				let ACT_COMM_TEL = team.connection.phone;
				let ACT_COMM_EMAIL = team.connection.email;
				
				let activityPost2 = {
					ACT_SUBJ_NAME: htmlencode.htmlEncode(req.body.ACT_SUBJ_NAME),
					ACT_BEG_DATE: ACT_BEG_DATE_POCH,
					ACT_END_DATE: ACT_END_DATE_POCH,
					ACT_DEPTNAME: team.name,
					ACT_LOCATION: ACT_LOCATION,
					ACT_LIMIT_SEX: htmlencode.htmlEncode(req.body.ACT_LIMIT_SEX),
					ACT_LIMIT: req.body.ACT_LIMIT,
					ACT_URL: htmlencode.htmlEncode(req.body.ACT_URL),
					ACT_COMM_USER: ACT_COMM_USER,
					ACT_COMM_TEL: ACT_COMM_TEL,
					ACT_COMM_EMAIL: ACT_COMM_EMAIL,			
					ACT_B_BEG: ACT_B_BEG_POCH,
					ACT_B_END: ACT_B_END_POCH,
					ACT_K_TEL: htmlencode.htmlEncode(req.body.ACT_K_TEL),
					ACT_K_DEPT: htmlencode.htmlEncode(req.body.ACT_K_DEPT),
					ACT_K_OCCUP: htmlencode.htmlEncode(req.body.ACT_K_OCCUP),
					ACT_K_IDNO: htmlencode.htmlEncode(req.body.ACT_K_IDNO),
					ACT_K_SEX: htmlencode.htmlEncode(req.body.ACT_K_SEX),
					ACT_K_BIRTH: htmlencode.htmlEncode(req.body.ACT_K_BIRTH),
					ACT_K_FOOD: htmlencode.htmlEncode(req.body.ACT_K_FOOD),
					ACT_K_ADDR: htmlencode.htmlEncode(req.body.ACT_K_ADDR),
					ACT_LIST: req.body.ACT_LIST,
					imgArray: imgArray,
					TEAM_ID: team._id
				}

				actPost.edit(req.body.editID, activityPost2, (err, errr) => {
					if(errr == 'success'){
						req.flash('success', '修改成功！！！');
						return res.redirect('/activityManage')
					}
					else {
						console.log(err);
						req.flash('error', '修改失敗！！！');
						return res.redirect('/activityManage')
					}
				});
			}
		});
		// if(ACT_NOT_SING) { //如果不開放報名
		// 	console.log('我在這');
		// 	let activityPost = {
		// 		ACT_SUBJ_NAME: htmlencode.htmlEncode(req.body.ACT_SUBJ_NAME),
		// 		ACT_BEG_DATE: ACT_BEG_DATE_POCH,
		// 		ACT_END_DATE: ACT_END_DATE_POCH,
		// 		ACT_DEPTNAME: htmlencode.htmlEncode(req.body.ACT_DEPTNAME),
		// 		ACT_LOCATION: ACT_LOCATION,
		// 		ACT_LIMIT_SEX: htmlencode.htmlEncode(req.body.ACT_LIMIT_SEX),
		// 		ACT_LIMIT: req.body.ACT_LIMIT,
		// 		ACT_URL: htmlencode.htmlEncode(req.body.ACT_URL),
		// 		ACT_COMM_USER: ACT_COMM_USER,
		// 		ACT_COMM_TEL: ACT_COMM_TEL,
		// 		ACT_COMM_EMAIL: ACT_COMM_EMAIL,			
		// 		ACT_B_BEG: ACT_B_BEG_POCH,
		// 		ACT_B_END: ACT_B_END_POCH,
		// 		ACT_K_TEL: htmlencode.htmlEncode(req.body.ACT_K_TEL),
		// 		ACT_K_DEPT: htmlencode.htmlEncode(req.body.ACT_K_DEPT),
		// 		ACT_K_OCCUP: htmlencode.htmlEncode(req.body.ACT_K_OCCUP),
		// 		ACT_K_IDNO: htmlencode.htmlEncode(req.body.ACT_K_IDNO),
		// 		ACT_K_SEX: htmlencode.htmlEncode(req.body.ACT_K_SEX),
		// 		ACT_K_BIRTH: htmlencode.htmlEncode(req.body.ACT_K_BIRTH),
		// 		ACT_K_FOOD: htmlencode.htmlEncode(req.body.ACT_K_FOOD),
		// 		ACT_K_ADDR: htmlencode.htmlEncode(req.body.ACT_K_ADDR),
		// 		ACT_LIST: htmlencode.htmlEncode(req.body.ACT_LIST),
		// 		imgArray: imgArray
		// 	}
		// 	actPost.edit(req.body.editID, activityPost, (err, errr) => {
		// 		if(errr == 'success'){
		// 			req.flash('success', '修改成功！！！');
		// 			return res.redirect('/activityManage')
		// 		}
		// 		else {
		// 			console.log(err);
		// 			req.flash('error', '修改失敗！！！');
		// 			return res.redirect('/activityManage')
		// 		}
		// 	});
		// } else {
			
		// }
	});

	app.post('/activity/delete', checkLogin);
	app.post('/activity/delete', (req, res) => {
		actPost.remove(req.body.data, (err) => {
			if(err == 'error')
				res.send('error');
			 else 
				res.send('success');
		});
	});

	//
	//隊伍
	//
	app.get('/teamManageAll', checkLogin);
	app.get('/teamManageAll', (req, res) => {
		// let page = req.query.p ? parseInt(req.query.p) : 1;
		Team.getAll((err, teams) => {
			res.render('teamManage', {
				title: '團隊管理',
				user: req.session.user,
				teams: JSON.stringify(teams),
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});		
		});
	});

	app.get('/teamManage', checkLogin);
	app.get('/teamManage', (req, res) => {
		teammate.getTeamIdByUserId(req.session.user._id, (err, teams) => {
			if(teams.length){
				if(err) {
					req.flash('error', '伺服器異常');
					return res.redirect('/');
				} else {
					let teamList = [];
					let i = 0;
					let len = teams.length;
					function run() {
						if(len == (i)) {
							return res.render('teamManage', {
								title: '團隊管理',
								user: req.session.user,
								teams: JSON.stringify(teamList),
								success: req.flash('success').toString(),
								error: req.flash('error').toString()
							});	
						} else {
							Team.getByIdForManage(teams[i].TEAM_ID, (err, team) => {
								if(err) {
									req.flash('error', '伺服器異常');
									return res.redirect('/');
								} else {
									teamList[i] = team;
									i++;
									
									run()
								}
							});
						}
					}
					run();
				}
			} else {
				return res.render('teamManage', {
					title: '團隊管理',
					user: req.session.user,
					teams: JSON.stringify([]),
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});	
			}
		});
	});

	//申請加入隊伍API
	app.get('/teamReview/:id', checkLogin);
	app.get('/teamReview/:id', (req, res) => {
		let team_id = req.params.id;
		let member_id = req.session.user._id;

		teammateReview.check(team_id, member_id, (err, review) => {
			if(err) {
				req.flash('error', err);
				return res.redirect('/team/' + team_id);
			} else {
				if(review) {
					if(review.STATE == 0) {
						req.flash('error', '要求審核中');
						return res.redirect('/team/' + team_id);
					} else if(review.STATE == 1) {
						req.flash('error', '已審核-未通過');
						return res.redirect('/team/' + team_id);
					} else if(review.STATE == 2) {
						req.flash('error', '已經是團隊隊員');
						return res.redirect('/team/' + team_id);
					}
				} else {

					let newReview = new teammateReview({
						team_id: team_id,
						member_id: member_id
					})
					
					newReview.save((err) => {
						if(err) {
							req.flash('error', '申請失敗！！！');
							return res.redirect('/team/' + team_id);
						} else {
							req.flash('success', '申請成功！！！');
							return res.redirect('/team/' + team_id);
						}
					});
				}
			}
		});
	});

	app.post('/team/get', checkLogin);
	app.post('/team/get', (req, res) => {
		teammate.isManager(req.session.user._id, req.body.data, (err, key) => {
			if(err) {
				console.log(err);
				return res.send('serError');
			}
			if(!key) {
				return res.send('error');
			} else if (key) {
				Team.take(req.body.data, (err, team) => {
					if(err){
						console.log(err);
						return res.send('serError');
					} else {
						team.name = htmlencode.htmlDecode(team.name);
						team.leader = htmlencode.htmlDecode(team.leader);
						team.purpose = htmlencode.htmlDecode(team.purpose);
						team.introduction = htmlencode.htmlDecode(team.introduction);
						team.pro_introduction = htmlencode.htmlDecode(team.pro_introduction);
						team.connection.name = htmlencode.htmlDecode(team.connection.name);
						res.send(team);
					}
				});
			}
		});
	});

	app.post('/teamCreate', checkLogin);
	app.post('/teamCreate', upload.any(), (req, res) => {
		let team = {
			name: htmlencode.htmlEncode(req.body.name),
			purpose: htmlencode.htmlEncode(req.body.purpose),
			introduction: htmlencode.htmlEncode(req.body.introduction),
			pro_introduction: htmlencode.htmlEncode(req.body.pro_introduction),
			leader: htmlencode.htmlEncode(req.body.leader),
			website: htmlencode.htmlEncode(req.body.website),
			connection: {
				name: htmlencode.htmlEncode(req.body.conecntName),
				phone: htmlencode.htmlEncode(req.body.phone),
				email: htmlencode.htmlEncode(req.body.email)
			}
		}

		for(let i = 0 ; i < req.files.length ; i++) {
			switch(req.files[i].fieldname) {
				case 'teamLogo':
					team.teamLogo = '/upload/' + req.files[i].filename;
					break;
				case 'teamIcon':
					team.teamIcon = '/upload/' + req.files[i].filename;
					break;
				case 'teamImg':
					team.teamImg = '/upload/' + req.files[i].filename;
					break;
			}
		}

		let newTeam = new Team(team)

		Team.check(newTeam.name, (err, team) => {
			if(err) {
				console.log(err)
				return res.redirect('/teamManage');
			}else if(team){
				req.flash('error', '隊伍名稱已存在');
				return res.redirect('/teamManage');
			} else {
				newTeam.save((err, team) => {
					if(err) {
						console.log(err);
						return res.redirect('/teamManage');
						
					} else {
						Team.getIdByTeamName(htmlencode.htmlEncode(team.name), (err, team) => {
							if(err) {
								req.flash('error', '伺服器異常');
								return res.redirect('back');
							} else {
								let newTeammate = new teammate({
									team_id: team._id,
									member_id: req.session.user._id,
									permission: 1
								})
								
								newTeammate.save((err) => {
									if(err) {
										req.flash('error', err)
										return res.redirect('/teamManage');
									} else {
										req.flash('success', '隊伍創建成功');
										return res.redirect('/teamManage');
									}
								});
							}
						});
					}
				});
			}
		});
	});

	app.post('/team/edit', checkLogin);
	app.post('/team/edit', upload.any(), (req, res) => {
		teammate.isManager(req.session.user._id, req.body.teamID, (err, key) => {
			if(err) {
				console.log(err);
				return res.redirect('/teamManage');
			} else if(!key) {
				req.flash('error', '權限不足');
				return res.redirect('/teamManage');
			} else if(key) {
				let team = {
					name: htmlencode.htmlEncode(req.body.name),
					purpose: htmlencode.htmlEncode(req.body.purpose),
					introduction: htmlencode.htmlEncode(req.body.introduction),
					pro_introduction: htmlencode.htmlEncode(req.body.pro_introduction),
					leader: htmlencode.htmlEncode(req.body.leader),
					website: htmlencode.htmlEncode(req.body.website),
					connection: {
						name: htmlencode.htmlEncode(req.body.conecntName),
						phone: htmlencode.htmlEncode(req.body.phone),
						email: htmlencode.htmlEncode(req.body.email)
					}
				}
				for(let i = 0 ; i < req.files.length ; i++) {
					switch(req.files[i].fieldname) {
						case 'editTeamLogo':
							team.teamLogo = '/upload/' + req.files[i].filename;
							break;
						case 'editTeamIcon':
							team.teamIcon = '/upload/' + req.files[i].filename;
							break;
						case 'editTeamImg':
							team.teamImg = '/upload/' + req.files[i].filename;
							break;
					}
				}
		
				Team.edit(req.body.teamID, team, (err, team) => {
					if(team == 'success'){
						req.flash('success', '修改成功！！！');
						return res.redirect('/teamManage');
					}
					else {
						req.flash('error', err);
						return res.redirect('/teamManage');
					}
				});
			}
		});
	});

	app.post('/team/delete', checkLogin);
	app.post('/team/delete', (req, res) => {
		//檢查permission
		teammate.isSupreme(req.session.user._id, req.body.data, (err, result) => {
			if(err) {
				console.log(err);
				return res.send('serError');
			} else {
				if(result) {
					teammate.removeAllTeammate(req.body.data, (err) => {
						if(err) {
							console.log(err);
							return res.send('serError');
						} else {
							Team.remove(req.body.data, (err) => {
								if(err == 'error'){
									console.log(err);
									return res.send('serError');
								} else { 
									return res.send('success');
								}
							});
						}
					});
				} else {
					console.log('err4');
					return res.send('error');
				}
			}	
		});
	});

	//
	//成果
	//
	app.get('/achievementManageAll', checkLogin);
	app.get('/achievementManageAll', (req, res) => {
		Team.getAll((err, teams) => {
			if(err)
				return res.redirect('/');
			else {
				achi.getAll((err, posts) => {
					if(err)
						return res.redirect('/');
					else {
						res.render('achievementManage', {
							title: '成果管理',
							user: req.session.user,
							teams: teams,
							posts: JSON.stringify(posts),
							success: req.flash('success').toString(),
							error: req.flash('error').toString()
						});
					}
				});
			}
		});
	});

	app.get('/achievementManage', checkLogin);
	app.get('/achievementManage', (req, res) => {
		teammate.getTeamIdByUserId(req.session.user._id, (err, teams) => {
			if(err) {
				req.flash('error', '伺服器異常');
				return res.redirect('/');
			} else {
				let achiList = [];
				let teamList = [];
				let j = 0;
				let i = 0;
				function run() {
					if(i >= teams.length ) {
						return res.render('achievementManage', {
							title: '成果管理',
							user: req.session.user,
							posts: JSON.stringify(achiList),
							teams: teamList,
							success: req.flash('success').toString(),
							error: req.flash('error').toString()
						});
					} else {
						achi.getAllOfTeamForManage(teams[i].TEAM_ID, (err, achis) => {
							if(err) {
								req.flash('error', '伺服器異常');
								return res.redirect('/');
							} else {
								Team.getNameById(teams[i].TEAM_ID, (err , team) => {
									if(err) {
										req.flash('error', '伺服器異常');
										return res.redirect('/');
									} else {
										teamList[i] = team;
										let k = 0;
										function run2() {
											if( k >= achis.length) {
												i++;
												run();
											} else {
												achiList[j] = achis[k];
												k++;
												j++;
												run2();
											}
										}
										run2();
									}
								});
							}
						});
					}		
				}
				run();
			}
		});
	});
	
	app.post('/achievement/create', checkLogin);
	app.post('/achievement/create', upload.array('ACHI_DEP_IMG', 100), (req, res) => {
		if(req.body.ACT_NAME) {
			let image = [];
			if(req.files.length == 0) {
				req.flash('error', '未上傳照片');
				return res.redirect('/achievementManage');
			} else if(req.body.ACHI_DEP == '') {
				req.flash('error', '成果內容未輸入');
				return res.redirect('/achievementManage');
			} else {
				req.files.forEach((file, index) => {
					image[index] = {
						NAME: file.filename,
						URL: '/upload/' + file.filename
					}
				});
				actPost.take(req.body.ACT_ID, (err, act) => {
					if(err){
						console.log(err);
						return res.redirect('/achievementManage');
					} else {
						let newAchi = new achi(
							req.body.ACT_ID,
							htmlencode.htmlEncode(req.body.ACT_NAME),
							act.ACT_DEPTNAME,
							act.ACT_BEG_DATE,
							act.ACT_END_DATE,
							act.ACT_LOCATION,
							image,
							htmlencode.htmlEncode(req.body.ACHI_DEP),
							req.body.TEAM_NAME
						)				
						
						newAchi.save((err) => {
							if(err) {
								req.flash('error', '伺服器異常');
								return res.redirect('/achievementManage');
							} else {
								req.flash('success', '新增成功');
								return res.redirect('/achievementManage');
							}
						});
					}
				});
			}
		} else {
			req.flash('error', '尚未選取活動');
			return res.redirect('/achievementManage');
		}
	});

	app.post('/achievement/edit', checkLogin);
	app.post('/achievement/edit', upload.array('ACHI_DEP_IMG', 100), (req, res) => {
		let image = [];
		let count = 0;
		let deleteImg = req.body.deleteImg.split(',');
		let key = false;
		if(!(deleteImg[0] == '')) {
			deleteImg.forEach((img, index) => {
				if(img != '') {
					image[count] = {
						URL: img,
						NAME: img.split('/upload/')[1]
					}
					count++;
				}
			});
			key = true;
		}

		if(!req.files.length == 0) {
			req.files.forEach((file, index) => {
				image[count] = {
					NAME: file.filename,
					URL: '/upload/' + file.filename
				}
				count++;
			});
			key = true;
		}
		htmlencode.htmlEncode
		if(key) {
			let update = {
				ACHI_STORE: htmlencode.htmlEncode(req.body.ACHI_DEP),
				ACHI_IMG: image
			}
			achi.edit(req.body.ACHI_ID, update, (err) => {
				if(err)
					req.flash('error', '資料庫模組異常');
				else 
					req.flash('success', '修改成功');
				return res.redirect('/achievementManage');
			});
		} else {
			let update = {
				ACHI_STORE: htmlencode.htmlEncode(req.body.ACHI_DEP),
			}
			achi.edit(req.body.ACHI_ID, update, (err) => {
				if(err)
					req.flash('error', '資料庫模組異常');
				else 
					req.flash('success', '修改成功');
				return res.redirect('/achievementManage');
			});
		}
	
	});

	app.post('/achievement/delete', checkLogin);
	app.post('/achievement/delete', (req, res) => {
		achi.remove(req.body.data.ID, (err) => {
			if(err == 'error')
				res.send('error');
			 else{
				 actPost.achiDelete(req.body.data.ACT_ID, (err) => {
					if(err)
						console.log(err)
					else
						res.send('success');
				 });
			 }
		});
	});

	app.post('/achievement/delete/photo', checkLogin);
	app.post('/achievement/delete/photo', (req, res) => {
		let myPath = process.cwd() + '/public/';
			req.body.data.forEach((img, index) => {
				fs.unlink(myPath + img, (err) => {
				if(err) throw err;
				console.log(err);
			});
		});
	});

	app.post('/achievement/get', checkLogin);
	app.post('/achievement/get', (req, res) => {
		achi.getById(req.body.data, (err, doc) => {
			if(err) {
				console.log(err);
				return res.redirect('/')
			} else {
				doc[0].ACT_NAME = htmlencode.htmlDecode(doc[0].ACT_NAME);
				doc[0].TEAM_NAME = htmlencode.htmlDecode(doc[0].TEAM_NAME);
				res.send(doc);
			}
		});
	});

	//拿取已結束尚未新增成果的活動
	app.post('/activity/get/noACHI', checkLogin);
	app.post('/activity/get/noACHI', (req, res) => {
		actPost.takeAllofAchiByTeam(req.body.data, false, (err, posts) => {
			if(err){
				console.log(err);
				return res.redirect('/achievementManage');
			} else {
				return res.send(posts);
			}
		});
	});

	//
	//成員管理
	//
	app.get('/memberManage', checkLogin);
	app.get('/memberManage', (req, res) => {
		teammate.getTeamIdByUserId(req.session.user._id, (err, teams) => {
			if(teams.length){
				if(err) {
					req.flash('error', '伺服器異常');
					return res.redirect('/');
				} else {
					let teamList = [];
					let i = 0;
					let len = teams.length;
					function run() {
						if(len == (i)) {
							return res.render('memberManage', {
								title: '成員管理',
								user: req.session.user,
								teamList: teamList,
								success: req.flash('success').toString(),
								error: req.flash('error').toString()
							});	
						} else {
							Team.getByIdForMember(teams[i].TEAM_ID, (err, team) => {
								if(err) {
									req.flash('error', '伺服器異常');
									return res.redirect('/');
								} else {
									teamList[i] = team;
									i++;
									
									run()
								}
							});
						}
					}
					run();
				}
			} else {
				return res.render('memberManage', {
					title: '成員管理',
					user: req.session.user,
					teamList: [],
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});	
			}
		});
	});

	//查看申請入隊隊員
	app.post('/review/teammate', checkLogin);
	app.post('/review/teammate', (req, res) => {
		teammateReview.getAllReviewNotYet(req.body.team, (err, reviews) => {
			if(err) {
				return res.send('error');
			} else {
				let users = [];
				reviews.forEach((review, i) => {
					User.getInfoByIdToReview(review.MEMBER_ID, (err, user) => {
						if(err) {
							return res.send('error');
						} else {
							users.push(user);
							if(reviews.length == (i + 1)) {
								let data = {
									reviews: reviews,
									users: users
								}
				
								return res.send(data);
							}
						}
					});
				});
			}
		});
	});

	//送出通過審核名單-通過
	app.post('/review/teammate/pass', checkLogin);
	app.post('/review/teammate/pass', (req, res) => {
		// console.log(req.body.data);
		// console.log(req.body.data.length);
		if(req.body.data.length) {
			req.body.data.forEach((id, i) => {
				teammateReview.allow(id, (err, review) => {
					if(err) {
						return res.send('1');
					} else {
						teammateReview.getInfoById(id, (err, review) => {
							if(err) {
								return res.send('1');
							} else {
								let newTeammate = new teammate({
									team_id: review.TEAM_ID,
									member_id: review.MEMBER_ID
								})
								
								newTeammate.save((err) => {
									if(err) {
										return res.send('1');
									} else {
										return res.send('2');
									}
								});
							}
						});
					}
				});
			});
		}else {
			return res.send('3');
		}
		
	});

	//送出通過審核名單-未通過
	app.post('/review/teammate/reject', checkLogin);
	app.post('/review/teammate/reject', (req, res) => {
		if(req.body.data.length) {
			req.body.data.forEach((id, i) => {
				teammateReview.deny(id, (err) => {
					if(err) {
						console.log(err);
						return res.send('1');
					}
					else {
						if((i + 1) == req.body.data.length) {
							return res.send('2')
						}
					}
				})
			});
		}else {
			return res.send('3');
		}
		
	});

	//取得隊員名單
	app.post('/teammate/get', checkLogin);
	app.post('/teammate/get', (req, res) => {
		teammate.getAllTeammate(req.body.team, (err, teammates) => {
			if(err) {
				console.log(err);
				return res.send('serError');
			} else {
				// console.log(teammates); array
				let userList = [];
				let i = 0;
				function run() {
					let userOB = new Object();
					User.getNamePhotoEmailById(teammates[i].MEMBER_ID, (err, user) => {
						if(err) {
							console.log(err);
							return res.send('serError');
						} else {
							userOB.NAME = htmlencode.htmlDecode(user.NAME);
							userOB._id = user._id;
							userOB.PERMISSION = teammates[i].PERMISSION;
							userOB.PHOTO = user.PHOTO;
							userOB.EMAIL = user.EMAIL;
							userList[i] = userOB;
							if( (i + 1) == teammates.length) {
								console.log(userList);
								return res.send(userList);
							} else {
								i++;
								run();
							}
						}
					});
				}
				run();

			}
		});
	});

	//提升管理權限
	app.post('/teammate/manage', checkLogin);
	app.post('/teammate/manage', (req, res) => {
		teammate.isTeammate(req.body.id, req.body.team, (err,key) => {
			if(err) {
				console.log(err);
				return res.send('serError');
			} else {
				if(!key) {
					return res.send('error2');
				} else {
					teammate.isSupreme(req.body.id, req.body.team, (err, key) => {
						if(err) {
							console.log(err);
							return res.send('serError');
						} else {
							if(key) {
								return res.send('error1');
							} else {
								teammate.isManager(req.body.id, req.body.team, (err, key) => {
									if(err) {
										console.log(err);
										return res.send('serError');
									} else {
										if(key) {
											
											return res.send('error1');
										} else {
											teammate.giveManage(req.body.id, req.body.team, (err, key) => {
												if(err) {
													console.log(err);
													return res.send('serError');
												} else {
													return res.send('success');
												}
											});
										}
									}
								});
							}
						}
					});
				}
			}
		});
	});

	//降為一般會員
	app.post('/teammate/normal', checkLogin);
	app.post('/teammate/normal', (req, res) => {
		teammate.isTeammate(req.body.id, req.body.team, (err, key) => {
			if(err) {
				console.log(err);
				return res.send('serError');
			} else if(!key) {
				return res.send('error2');
			} else {
				teammate.isSupreme(req.body.id, req.body.team, (err, key) => {
					if(err) {
						console.log(err);
						return res.send('serError');
					} else {
						if(key) {
							return res.send('error3');
						} else {
							teammate.isManager(req.body.id, req.body.team, (err, key) => {
								if(err) {
									console.log(err);
									return res.send('serError');
								} else {
									if(key) {
										teammate.giveNormal(req.body.id, req.body.team, (err, key) => {
											if(err) {
												console.log(err);
												return res.send('serError');
											} else {
												return res.send('success');
											}
										});
									} else {
										return res.send('error1');
									}
								}
							});
						}
					}
				});
			}
		});
	});

	//轉讓最高權限
	app.post('/teammate/giveSupreme', checkLogin);
	app.post('/teammate/giveSupreme', (req, res) => {
		teammate.isTeammate(req.body.id, req.body.team, (err, key) => {
			if(err) {
				console.log(err);
				return res.send('serError');
			} else if(!key) {
				return res.send('error2');
			} else {
				teammate.isSupreme(req.session.user._id, req.body.team, (err, key) => {
					if(err) {
						console.log(err);
						return res.send('serError');
					} else {
						if(key) {
							teammate.turnSupreme(req.body.id, req.body.team, (err, key) => {
								if(err) {
									console.log(err);
									return res.send('serError');
								} else {
									teammate.giveNormal(req.session.user._id, req.body.team, (err, key) => {
										if(err) {
											console.log(err);
											return res.send('serError');
										} else {
											return res.send('success');
										}
									});
								}
							});
						} else {
							return res.send('error3');
						}
					}
				});
			}
		});
	});


	//
	//個人資料
	//
	app.get('/profile', checkLogin);
	app.get('/profile', (req, res) => {
		//get 使用者資料
		User.getById(req.session.user._id, (err, user) => {
			if(err) {
				req.flash('error', '讀取資料失敗');
				return res.redirect('/');
			} else if(user) {
				req.session.user.NAME = htmlencode.htmlDecode(user.NAME);
				req.session.user.FAMILY_NAME = htmlencode.htmlDecode(user.FAMILY_NAME);
				req.session.user.GIVEN_NAME = htmlencode.htmlDecode(user.GIVEN_NAME);
				req.session.user.ADDR = htmlencode.htmlDecode(user.ADDR)
				//處理日期-start
				let birthdayDate = new Date(user.BIRTHDAY);
				let birthdayMonth = (birthdayDate.getMonth() + 1)
				if(birthdayMonth < 10)
					birthdayMonth = '0' + birthdayMonth;
				let birthday = birthdayDate.getFullYear() + '-' + birthdayMonth + '-' + birthdayDate.getDate();
				req.session.user.BIRTHDAY = birthday;
				//處理日期-end
				return res.render('profile', {
					title: '個人資料',
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				})
			}
			
		});
		
	});

	app.post('/profile', checkLogin);
	app.post('/profile', upload.any(), (req, res) => {
		User.getById(req.session.user._id, (err, user) => {
			if(err) {
				return res.send(err);
			} else if(user) {
				let re = /^\d{10}$/;
				if(!re.test(req.body.phone)) {
					req.flash('error', '手機號碼格式錯誤');
					return res.redirect('/profile/' + id);
				} else {
					let birthday = new Date(req.body.birthday).getTime();
					let editUser = {
						FAMILY_NAME: htmlencode.htmlEncode(req.body.family_name),
						GIVEN_NAME: htmlencode.htmlEncode(req.body.given_name),
						NAME: htmlencode.htmlEncode(req.body.name),
						BIRTHDAY: birthday,
						PHONE: req.body.phone, 
						ADDR: htmlencode.htmlEncode(req.body.address),
					}
					
					//處理圖片_start
					if(req.files.length){
						editUser.PHONE = '/upload/' + req.files[0].filename;
					}

					//處理圖片_end
					User.edit(id, editUser, (err, result) => {
						if(err) {
							req.flash('error', '修改失敗！！');
							return res.redirect('/profile/' + id);
						} else if(result) {
							req.flash('error', '修改成功！！');
							return res.redirect('/profile/' + id);
						}
					});
				}
			}
		});
	});

	//
	//其他
	//
	app.post('/uploadImg', checkLogin);
	app.post('/uploadImg', upload.single('imgFile'),  (req, res) => {
		let info = { 
	        "error": 0, 
	        "url": '/upload/' + req.file.filename
	    }; 
	    res.send(info); 
	});

	//
	//領導
	//
	app.get('/leaderManage', checkLogin);
	app.get('/leaderManage',  (req, res) => {
		let page = req.query.p ? parseInt(req.query.p) : 1;
		Leader.getLimit(null, page, 6,(err, leaders, leaderTotal) => {
			if(err) {
				console.log(err);
				return res.redirect('/leaderManage');
			}

			res.render('leaderManage', {
				title: '隊長管理',
				user: req.session.user,
				leaders: leaders,
				page: page,
				isFirstPage: ((page - 1) == 0),
				isLastPage: (Number((page - 1) * 6 + leaders.length) == Number(leaderTotal)),
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});		
	});

	//
	//函數
	//
	function checkLogin(req, res, next) {
		if(!req.session.user) {
			return res.redirect('/google/login');
		}
		next();
	}

	function checkNotLogin(req, res, next) {
		if(req.session.user) {
			req.flash('error', '已登錄!!');
			return res.redirect('/');
		}
		next();
	}
}