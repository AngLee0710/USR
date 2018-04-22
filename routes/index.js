let crypto = require('crypto');
let User = require('../models/user.js');

module.exports = function(app) {
	app.get('/', function(req, res) {
		res.render('index', {
			title: '大學生社會責任平台',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
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
			title: '登入後台',
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
			req.flash('success', '登錄成功');
			res.redirect('/');
		});
	});

	app.get('/logout', checkLogin);
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', '登出成功');
		res.redirect('/');
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