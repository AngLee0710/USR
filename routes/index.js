"use strict";
const crypto = require('crypto');
const multer  = require('multer');
const fs = require('fs');

const User = require('../models/user.js');
const Team = require('../models/team.js');
const actPost = require('../models/activity.js');
const Leader = require('../models/leader.js');

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/upload')
	},
	filename: function (req, file, cb) {
		cb(null, file.fieldname + '.' + file.mimetype.split('/')[1]);
	}
});

var upload = multer({ storage: storage });


module.exports = function(app) {
	app.get('/', function(req, res) {
		actPost.getLimit(null, 1, 3, function(err, posts, total) {
			if(err) 
				posts = [];
			
			res.render('index', {
				title: '大學生社會責任平台',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/leader/:nick', function(req, res) {
		Leader.get(req.params.nick, function(err, leader) {
			console.log(leader.teams.length);
			res.render('leader', {
				title: '隊長介紹',
				user: req.session.user,
				leader: leader,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/aboutUs', function(req, res) {
		res.render('aboutUs', {
			title: '關於我們',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	});

	app.get('/connectUs', function(req, res) {
		res.render('connectUs', {
			title: '聯絡我們',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	});

	app.get('/activity', function(req, res) {
		let page = req.query.p ? parseInt(req.query.p) : 1;

		actPost.getLimit(null, page, 6, function(err, posts, total) {
			if(err) 
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

	app.get('/activity/:title/:day', function(req, res) {
		actPost.get(req.params.title, req.params.day, function(err, post){
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('activity', {
				title: post.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/team', function(req, res) {
		let page = req.query.p ? parseInt(req.query.p) : 1;

		Team.getLimit(null, page, 6, function(err, teams, total) {
			if(err) {
				teams = [];
			}

			Leader.getAll((err, leaders) => {
				res.render('teamList', {
					title: '團隊介紹',
					teams: teams,
					page: page,
					isFirstPage: (page - 1) == 0,
					isLastPage: ((page - 1) * 6 + teams.length) == total,
					leaders: leaders,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});

	app.get('/team/:name', function(req, res) {
		Team.get(req.params.name, function(err, team){
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			if(!team) {
				req.flash('error', '隊伍不存在');
				return res.redirect('/');
			}

			Leader.get(team.leader, (err, leader) => {
				res.render('team', {
					title: team.name,
					teams: team,
					leader: leader.name,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});

	// app.get('/reg', checkNotLogin);
	// app.get('/reg', function(req, res) {
	// 	res.render('reg', {
	// 		title: '註冊',
	// 		user: req.session.user,
	// 		success: req.flash('success').toString(),
	// 		error: req.flash('error').toString()
	// 	});
	// });

	// app.post('/reg', checkNotLogin);
	// app.post('/reg', function(req, res) {
	// 	let name = req.body.name;
	// 	let password = req.body.password;
	// 	let password_r = req.body['password-repeat'];

	// 	if(!name) {
	// 		req.flash('error', '未輸入帳號');
	// 		return res.redirect('/reg');
	// 	}

	// 	if(password_r != password) {
	// 		req.flash('error', '兩次輸入密碼不一致');
	// 		return res.redirect('/reg');
	// 	}
	// 	let md5 = crypto.createHash('md5');
	// 	password = md5.update(req.body.password).digest('hex');
	// 	let newUser = new User({
	// 		name: req.body.name,
	// 		password: password
	// 	});

	// 	User.get(newUser.name, function(err, user) {
	// 		if(err) {
	// 			req.flash('error', err);
	// 			return res.redirect('/');
	// 		}

	// 		if(user) {
	// 			req.flash('error', '用戶已存在');
	// 			return res.redirect('/reg');
	// 		}
	// 		newUser.save(function(err, user) {
	// 			if(err) {
	// 				req.flash('error', err);
	// 				return res.redirect('/reg');
	// 			}
	// 			req.session.user = user;
	// 			req.flash('success', '註冊成功!');
	// 			res.redirect('/');
	// 		});
	// 	});
	// });

	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('login', {
			title: '登入頁面',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res) {
		let md5 = crypto.createHash('md5');
		let password = md5.update(req.body.password).digest('hex');
		User.get(req.body.name, function(err, user) {
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
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', '登出成功!!');
		res.redirect('/');
	});

	app.get('/admin', checkLogin);
	app.get('/admin', function(req, res) {
		res.render('admin', {
			title: '後台管理',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/activityCreate', checkLogin);
	app.get('/activityCreate', function(req, res) {
		res.render('activityCreate', {
			title: '新增活動',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/activityCreate', checkLogin);
	app.post('/activityCreate', function(req, res, next) {
		let activityPost = new actPost(
			req.body.title,
			req.body.content,
			req.body.place
		);
		activityPost.save(function(err){
			if(err) {
				req.flash('error', err);
				return res.redirect('/activityCreate');
			} else {
				return res.redirect('/activity');
			}
		});
	});

	app.get('/leaderCreate', checkLogin);
	app.get('/leaderCreate', function(req, res) {
		res.render('leaderCreate', {
			title: '新增隊長',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/leaderCreate', checkLogin);
	app.post('/leaderCreate', function(req, res, next) {
		let newLeader = new Leader({
			name: req.body.name,
			title: req.body.title,
			nick: req.body.nick
		})

		Leader.check(newLeader.nick, function(err, nick) {

			if(err) {
				console.log(err)
				return res.redirect('/leaderCreate');
			} else if(nick) {
				console.log('自然名已存在');
				return res.redirect('/leaderCreate');
			}

			newLeader.save((err) => {
				if(err){
					console.log(err);
					return res.redirect('/leaderCreate');
				} else {
					return res.redirect('/leader');
				}
			});
		});
	});


	app.get('/teamCreate', checkLogin);
	app.get('/teamCreate', function(req, res) {
		res.render('teamCreate', {
			title: '團隊新增',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/teamCreate', checkLogin);
	app.post('/teamCreate', function(req, res, next) {
		let newTeam = new Team({
			name: req.body.name,
			purpose: req.body.purpose,
			introduction: req.body.introduction,
			pro_introduction: req.body.pro_introduction,
			leader: req.body.leader,
			leader_title: req.body.leader_title,
			leader_nick: req.body.leader_nick,
			website: req.body.website,
			connection: {
				name: req.body.conecntName,
				phone: req.body.phone,
				email: req.body.email
			}
		})

		Team.check(newTeam.name, function(err, team) {
			if(err) {
				console.log('1');
				return res.redirect('/teamCreate');
			}else if(team){
				console.log('隊伍已存在');
				console.log('2');
				return res.redirect('/team');
			}

			newTeam.save(function(err) {
				if(err) {
					console.log(err);
					console.log('3');
					return res.redirect('/teamCreate');
					
				} else {
					console.log('success');
					console.log('4');
					return res.redirect('/team');
					next();
				}
			});
		});
	});

	app.get('/leaderManager', checkLogin);
	app.get('/leaderManager', function(req, res) {
		Leader.getAll((err, leaders) => {
			if(err) {
				console.log(err);
				res.redirect('/leaderManager');
			}
			res.render('leaderManager', {
				title: '隊長管理',
				user: req.session.user,
				leaders: leaders,
				tableOfLeader: [],
				flag: false
			});
		});		
	});

	app.post('/leaderManager', checkLogin);
	app.post('/leaderManager', function(req, res) {
		let newTeam = new Team({
			name: req.body.name,
			purpose: req.body.purpose,
			introduction: req.body.introduction,
			pro_introduction: req.body.pro_introduction,
			leader: req.body.leader,
			leader_title: req.body.leader_title,
			leader_nick: req.body.leader_nick,
			website: req.body.website,
			connection: {
				name: req.body.conecntName,
				phone: req.body.phone,
				email: req.body.email
			}
		})

		Team.check(newTeam.name, function(err, team) {
			if(err) {
				console.log('1');
				return res.redirect('/teamCreate');
			}else if(team){
				console.log('隊伍已存在');
				console.log('2');
				return res.redirect('/team');
			}

			newTeam.save(function(err) {
				if(err) {
					console.log(err);
					console.log('3');
					return res.redirect('/teamCreate');
					
				} else {
					console.log('success');
					console.log('4');
					return res.redirect('/team');
					next();
				}
			});
		});
	});

	app.get('/activity_manage', checkLogin);
	app.get('/activity_manage', function(req, res) {
		res.render('activity_manage', {
			title: '活動管理',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/achievement_manage', checkLogin);
	app.get('/achievement_manage', function(req, res) {
		res.render('achievement_manage', {
			title: '成果管理',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/team_manage', checkLogin);
	app.get('/team_manage', function(req, res) {
		res.render('team_manage', {
			title: '團隊管理',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/uploadImg', checkLogin);
	app.post('/uploadImg', upload.single('imgFile'), function(req, res) {
		let info = { 
	        "error": 0, 
	        "url": 'upload/' + req.file.fieldname + '.' + req.file.mimetype.split('/')[1]
	    }; 
	    res.send(info); 
	});

	app.post('/leaderSearch', checkLogin);
	app.post('/leaderSearch', (req, res) => {
		Leader.get(req.body.nick, (err, leader) => {
			res.send(leader);
		});
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