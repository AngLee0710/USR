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
			res.redirect('/admin');
		});
	});

	app.get('/logout', checkLogin);
	app.get('/logout', (req, res) => {
		req.session.user = null;
		req.flash('success', '登出成功!!');
		res.redirect('/');
	});

	app.get('/admin', checkLogin);
	app.get('/admin', (req, res) => {
		res.render('admin', {
			title: '後台管理',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/activityCreate', checkLogin);
	app.get('/activityCreate', (req, res) => {
		res.render('activityCreate', {
			title: '新增活動',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/activityCreate', checkLogin);
	app.post('/activityCreate', (req, res, next) => {
		let $ = cheerio.load(req.body.content);
		let imgArray = [];

		for(let i = 0 ; i < $('img').length ; i++) {
			imgArray[i] = {
				url: $('img')[i].attribs.src
			}
		}

		console.log(imgArray);

		let activityPost = new actPost(
			req.body.title,
			req.body.content,
			req.body.place,
			imgArray
		);

		activityPost.save((err) => {
			if(err) {
				console.log(err);
				return res.redirect('/activityCreate');
			} else {
				return res.redirect('/activity');
			}
		});
	});

	app.get('/activityManage', checkLogin);
	app.get('/activityManage', (req, res) => {
		let page = req.query.p ? parseInt(req.query.p) : 1;


		actPost.getLimit(null, page, 6, (err, actPosts, total) => {
			if(err) {
				req.flash('error', err);
				return res.redirect('admin');
			}else {
					res.render('activityManage', {
					title: '活動管理',
					user: req.session.user,
					actPosts: actPosts,
					page: page,
					isFirstPage: ((page - 1) == 0),
					isLastPage: (((page - 1) * 6 + actPosts.length) == total),
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});		
			}			
		});
	});

	app.get('/activity/edit/:title/:time', checkLogin);
	app.get('/activity/edit/:title/:time', (req, res) => {
		actPost.get(req.params.title, req.params.time, (err, actPost) => {
			if(err){
				req.flash('error', err);
				return res.redirect('/activityManage');
			} else {
				res.render('activityEdit', {
					title: '編輯活動',
					user: req.session.user,
					actPost: actPost,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			}
		});
	});

	app.post('/activity/edit/:title/:time', checkLogin);
	app.post('/activity/edit/:title/:time', (req, res) => {
		let post = {
			otitle: req.body.otitle,
			title: req.body.title,
			time: req.body.time,
			place: req.body.place,
			content: req.body.content
		}

		actPost.edit(post, (err, actPost) => {
			if(err){
				req.flash('error', err);
				return res.redirect('/activityManage');
			} else {
				req.flash('success', '更改成功');
				res.redirect('/activityManage');
			}
		});
	});

	app.get('/activity/delete/:title/:time', checkLogin);
	app.get('/activity/delete/:title/:time', (req, res) => {
		let post = {
			title: req.params.title,
			time: req.params.time,
		}

		actPost.remove(post, (err) => {
			if(err){
				req.flash('error', err);
				return res.redirect('/activityManage');
			} else {
				req.flash('success', '刪除成功');
				res.redirect('/activityManage');
			}
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