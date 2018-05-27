	app.get('/reg', checkNotLogin);
	app.get('/reg', (req, res) => {
		res.render('reg', {
			title: '註冊',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', (req, res) => {
		let name = req.body.name;
		let password = req.body.password;
		let password_r = req.body['password-repeat'];

		if(!name) {
			req.flash('error', '未輸入帳號');
			return res.redirect('/reg');
		}

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

		User.get(newUser.name, (err, user) => {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}

			if(user) {
				req.flash('error', '用戶已存在');
				return res.redirect('/reg');
			}
			newUser.save((err, user) => {
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