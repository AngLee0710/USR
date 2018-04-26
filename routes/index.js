let crypto = require('crypto');
let User = require('../models/user.js');
let Team = require('../models/team.js');

module.exports = function(app) {
	app.get('/', function(req, res) {
		res.render('index', {
			title: '大學生社會責任平台',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/team', function(req, res) {
		let page = req.query.p ? parseInt(req.query.p) : 1;

		Team.getSix(null, page, function(err, teams, total) {
			if(err) {
				teams = [];
			}
			console.log(teams);
			res.render('teamList', {
				title: '團隊介紹',
				teams: teams,
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * 6 + teams.length) == total,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/team/:name', function(req, res) {
		Team.get(req.params.name, function(err, team) {
			if(!team) {
				req.flash('error', '隊伍不存在');
				return res.redirect('/');
			}
			//query nad return user all post
			Team.getOne(team.name, function(err, teams){
				if(err) {
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('team', {
					title: team.name,
					teams: teams,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				})
			})
		})
	});

	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res) {
		res.render('reg', {
			title: '註冊',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res) {
		let name = req.body.name;
		let password = req.body.password;
		let password_r = req.body['password-repeat'];

		if(password_r != password) {
			req.flash('error', '兩次輸入密碼不一致');
			return res.redirect('/reg');
		}
		let md5 = crypto.createHash('md5');
		password = md5.update(req.body.password).digest('hex');
		let newUser = new User({
			name: req.body.name,
			password: password
		});

		User.get(newUser.name, function(err, user) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}

			if(user) {
				req.flash('error', '用戶已存在');
				return res.redirect('/reg');
			}
			newUser.save(function(err, user) {
				if(err) {
					req.flash('error', err);
					return res.redirect('/reg');
				}
				req.session.user = user;
				req.flash('success', '註冊成功!');
				res.redirect('/');
			});
		});
	});

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

	app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		res.render('post', {
			title: '新增公告',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
	});

	app.get('/activity', checkLogin);
	app.get('/activity', function(req, res) {
		res.render('activity', {
			title: '新增活動',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/activity', checkLogin);
	app.post('/activity', function(req, res) {
	});

	app.get('/achievement', checkLogin);
	app.get('/achievement', function(req, res) {
		res.render('achievement', {
			title: '成果新增',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/achievement', checkLogin);
	app.post('/achievement', function(req, res) {
	});

	app.get('/createTeam', checkLogin);
	app.get('/createTeam', function(req, res) {
		res.render('createTeam', {
			title: '團隊新增',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/createTeam', checkLogin);
	app.post('/createTeam', function(req, res) {
		let newTeam = new Team({
			name: req.body.name,
			purpose: req.body.purpose,
			introduction: req.body.introduction,
			pro_introduction: req.body.pro_introduction,
			leader: req.body.leader,
			website: req.body.website,
			email: req.body.email
		})

		Team.get(newTeam.name, function(err, team) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/admin');
			}
			if(team) {
				req.flash('error', '隊伍已存在');
				console.log('隊伍已存在');
				return res.redirect('/team');
			}
			newTeam.save(function(err) {
				if(err) {
					req.flash('error', err);
					console.log(err);
					return res.redirect('/team');
				}
				req.flash('success', '隊伍新增成功');
				res.redirect('/admin');
			});
		});
	});

	app.get('/post_manage', checkLogin);
	app.get('/post_manage', function(req, res) {
		res.render('post_manage', {
			title: '公告管理',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/post_manage', checkLogin);
	app.post('/post_manage', function(req, res) {
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

	app.post('/activity_manage', checkLogin);
	app.post('/activity_manage', function(req, res) {
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

	app.post('/achievement_manage', checkLogin);
	app.post('/achievement_manage', function(req, res) {
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

	app.post('/team_manage', checkLogin);
	app.post('/team_manage', function(req, res) {
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