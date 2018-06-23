"use strict";
const crypto = require('crypto');
const multer  = require('multer');
const fs = require('fs');
const cheerio = require('cheerio');

const User = require('../models/user.js');
const Team = require('../models/team.js');
const actPost = require('../models/activity.js');
const Leader = require('../models/leader.js');

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
	app.get('/login', checkNotLogin);
	app.get('/login', (req, res) => {
		res.render('login', {
			title: '登入頁面',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/login', checkNotLogin);
	app.post('/login', (req, res) => {
		let md5 = crypto.createHash('md5');
		let password = md5.update(req.body.password).digest('hex');
		User.get(req.body.name, (err, user) => {
			if(!user) {
				req.flash('error', '用戶不存在!');
				return res.redirect('/login');
			}
			if(user.password != password) {
				req.flash('error', '密碼錯誤!');
				return res.redirect('/login');
			}
			req.session.user = user;
			req.flash('success', '登錄成功!!');
			res.redirect('/activityManage');
		});
	});

	app.get('/activityManage', checkLogin);
	app.get('/activityManage', (req, res) => {
		let page = req.query.p ? parseInt(req.query.p) : 1;
		actPost.getLimit(null, page, 6, (err, actPosts, actTotal) => {
			if(err) {
				req.flash('error', err);
				return res.redirect('/activityManage');
			}else {
				Team.getLimit(null, page, 'max', (err, teams, total) => {
					res.render('activityManage', {
						title: '活動管理',
						user: req.session.user,
						actPosts: actPosts,
						teams: teams,
						page: page,
						isFirstPage: ((page - 1) == 0),
						isLastPage: (Number((page - 1) * 6 + actPosts.length) == Number(actTotal)),
						success: req.flash('success').toString(),
						error: req.flash('error').toString()
					});		
				})	
			}			
		});
	});

	app.post('/activityCreate', checkLogin);
	app.post('/activityCreate', (req, res, next) => {
		let $ = cheerio.load(req.body.ACT_LIST);
		let imgArray = [];

		for(let i = 0 ; i < $('img').length ; i++) {
			imgArray[i] = {
				url: $('img')[i].attribs.src
			}
		}

		Team.check(req.body.ACT_DEPTNAME, (err, team) => {
			let ACT_BEG_DATE = req.body.ACT_BEG_DATE_D + ' ' + req.body.ACT_BEG_DATE_T,
			ACT_END_DATE = req.body.ACT_END_DATE_D + ' '	+ req.body.ACT_END_DATE_T,
			ACT_COMM_USER = team.connection.name,
			ACT_COMM_TEL = team.connection.phone,
			ACT_COMM_EMAIL = team.connection.email,
			ACT_B_BEG = req.body.ACT_B_BEG_D + ' ' + req.body.ACT_B_BEG_T,
			ACT_B_END = req.body.ACT_B_END_D + ' ' + req.body.ACT_B_END_T;

			let activityPost = new actPost(
				req.body.ACT_SUBJ_NAME,
				ACT_BEG_DATE,
				ACT_END_DATE,
				req.body.ACT_DEPTNAME,
				req.body.ACT_LOCATION,
				req.body.ACT_LIMIT_SEX,
				req.body.ACT_LIMIT,
				req.body.ACT_URL,
				ACT_COMM_USER,
				ACT_COMM_TEL,
				ACT_COMM_EMAIL,			
				ACT_B_BEG,
				ACT_B_END,
				req.body.ACT_K_TEL,
				req.body.ACT_K_DEPT,
				req.body.ACT_K_OCCUP,
				req.body.ACT_K_IDNO,
				req.body.ACT_K_SEX,
				req.body.ACT_K_BIRTH,
				req.body.ACT_K_FOOD,
				req.body.ACT_K_ADDR,
				req.body.ACT_LIST,
				imgArray
			);

			activityPost.save((err) => {
				if(err) {
					console.log(err);
					return res.redirect('/activityCreate');
				} else {
					return res.redirect('activityManage');
				}
			});
		});
	});

	app.post('/activity/get', checkLogin);
	app.post('/activity/get', (req, res) => {
		actPost.tack(req.body.data, (err, actPost) => {
			if(err){
				req.flash('error', err);
				return res.redirect('/activityManage');
			} else {
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

		Team.check(req.body.ACT_DEPTNAME, (err, team) => {
			if(err) {
				console.log(err);
				return res.redirect('/activityManage');
			}
			let ACT_BEG_DATE = req.body.ACT_BEG_DATE_D + ' ' + req.body.ACT_BEG_DATE_T,
			ACT_END_DATE = req.body.ACT_END_DATE_D + ' '	+ req.body.ACT_END_DATE_T,
			ACT_COMM_USER = team.connection.name,
			ACT_COMM_TEL = team.connection.phone,
			ACT_COMM_EMAIL = team.connection.email,
			ACT_B_BEG = req.body.ACT_B_BEG_D + ' ' + req.body.ACT_B_BEG_T,
			ACT_B_END = req.body.ACT_B_END_D + ' ' + req.body.ACT_B_END_T;

			let activityPost = {
				ACT_SUBJ_NAME: req.body.ACT_SUBJ_NAME,
				ACT_BEG_DATE: ACT_BEG_DATE,
				ACT_END_DATE: ACT_END_DATE,
				ACT_DEPTNAME: req.body.ACT_DEPTNAME,
				ACT_LOCATION: req.body.ACT_LOCATION,
				ACT_LIMIT_SEX: req.body.ACT_LIMIT_SEX,
				ACT_LIMIT: req.body.ACT_LIMIT,
				ACT_URL: req.body.ACT_URL,
				ACT_COMM_USER: ACT_COMM_USER,
				ACT_COMM_TEL: ACT_COMM_TEL,
				ACT_COMM_EMAIL: ACT_COMM_EMAIL,			
				ACT_B_BEG: ACT_B_BEG,
				ACT_B_END: ACT_B_END,
				ACT_K_TEL: req.body.ACT_K_TEL,
				ACT_K_DEPT: req.body.ACT_K_DEPT,
				ACT_K_OCCUP: req.body.ACT_K_OCCUP,
				ACT_K_IDNO: req.body.ACT_K_IDNO,
				ACT_K_SEX: req.body.ACT_K_SEX,
				ACT_K_BIRTH: req.body.ACT_K_BIRTH,
				ACT_K_FOOD: req.body.ACT_K_FOOD,
				ACT_K_ADDR: req.body.ACT_K_ADDR,
				ACT_LIST: req.body.ACT_LIST,
				imgArray: imgArray
			}

			console.log(req.body.editID);

			actPost.edit(req.body.editID, activityPost, (err, errr) => {
				if(errr == 'success')
					return res.redirect('/activityManage')
				else {
					console.log(err);
					return res.redirect('/activityManage')
				}
			});
		});
	});

	app.post('/activity/delete', checkLogin);
	app.post('/activity/delete', (req, res) => {
		actPost.remove(req.body.data, (err) => {
			if(err == 'error')
				res.send('error')
			 else 
				res.send('success');
		});
	});

	app.get('/leaderCreate', checkLogin);
	app.get('/leaderCreate', (req, res) => {
		res.render('leaderCreate', {
			title: '新增隊長',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/leaderCreate', checkLogin);
	app.post('/leaderCreate', (req, res, next) => {
		let newLeader = new Leader({
			name: req.body.name,
			title: req.body.title,
			nick: req.body.nick,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})

		Leader.check(newLeader.nick, (err, nick) => {

			if(err) {
				req.flash('error', err);
				return res.redirect('/leaderCreate');
			} else if(nick) {
				req.flash('error', '自然名已存在');
				return res.redirect('/leaderCreate');
			}

			newLeader.save((err) => {
				if(err){
					req.flash('error', err);
					return res.redirect('/leaderCreate');
				} else {
					return res.redirect('/leaderManage');
				}
			});
		});
	});

	app.get('/leaderManage', checkLogin);
	app.get('/leaderManage',  (req, res) => {
		Leader.getAll((err, leaders) => {
			if(err) {
				req.flash('error', err);
				return res.redirect('/leaderManage');
			}

			res.render('leaderManage', {
				title: '隊長管理',
				user: req.session.user,
				leaders: leaders,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});		
	});

	app.get('/leader/edit/:nick', checkLogin);
	app.get('/leader/edit/:nick', (req, res) => {
		let nick = req.params.nick;

		Leader.get(nick, (err, leader) => {
			if(err) {
				res.flash('error', err);
				return res.redirect('/leaderManage');
			} else {
				res.render('leaderEdit', {
					title: '編輯隊長',
					user: req.session.user,
					leader: leader,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			}
		});
	});

	app.post('/leader/edit/:nick', checkLogin);
	app.post('/leader/edit/:nick', (req, res) => {
		let leader = {
			name: req.body.name,
			nick: req.body.nick,
			title: req.body.title,
			phone: req.body.phone,
			email: req.body.email,
			headImg: req.body.headImg
		}

		Leader.edit(leader, (err, doc) => {
			if(err) {
				req.flash('error', err);
				return res.redirect('/leaderManage');
			}else {
				req.flash('success', '更新成功');
				return res.redirect('/leaderManage');
			}
		});
	});

	app.get('/teamCreate', checkLogin);
	app.get('/teamCreate', (req, res) => {
		let p = req.query.p;
		Leader.get(p, (err, leader) => {
			if(err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			else if(leader == null) {
				req.flash('error', '隊長不存在')
				return res.redirect('back');
			}else{
				res.render('teamCreate', {
					title: '團隊新增',
					leader: p,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			}
		});
		
	});

	app.post('/teamCreate', checkLogin);
	app.post('/teamCreate', (req, res, next) => {
		let newTeam = new Team({
			name: req.body.name,
			purpose: req.body.purpose,
			introduction: req.body.introduction,
			pro_introduction: req.body.pro_introduction,
			leader: req.body.leader,
			website: req.body.website,
			connection: {
				name: req.body.conecntName,
				phone: req.body.phone,
				email: req.body.email
			}
		})

		Team.check(newTeam.name, (err, team) => {
			if(err) {
				req.flash('error', err);
				return res.redirect('/teamCreate');
			}else if(team){
				req.flash('error', '隊伍已存在');
				return res.redirect('/team');
			}

			newTeam.save((err) => {
				if(err) {
					req.flash('error', err);
					return res.redirect('/teamCreate');
					
				} else {
					req.flash('success', '隊伍創建成功');
					return res.redirect('/team');
					next();
				}
			});
		});
	});

	app.get('/admin', checkLogin);
	app.get('/admin', (req, res) => {
		res.redirect('/activityManage');
	});

	app.get('/logout', checkLogin);
	app.get('/logout', (req, res) => {
		req.session.user = null;
		res.redirect('/');
	});


	app.post('/uploadImg', checkLogin);
	app.post('/uploadImg', upload.single('imgFile'),  (req, res) => {
		let info = { 
	        "error": 0, 
	        "url": 'upload/' + req.file.filename
	    }; 
	    res.send(info); 
	});

	function checkLogin(req, res, next) {
		if(!req.session.user) {
			req.flash('error', '未登錄!!');
			return res.redirect('/login');
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