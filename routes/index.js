"use strict";
const Team = require('../models/team.js');
const actPost = require('../models/activity.js');
const Leader = require('../models/leader.js');
const actSignUp = require('../models/actSingUp.js');
const achi = require('../models/achievement.js');

const fs = require('fs');


module.exports =  (app) => {
	app.get('/', (req, res) => {
		actPost.getLimit(null, 1, 3, (err, posts, total) => {
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

	app.get('/achievement', (req, res) => {
		res.render('achievement', {
			title: '關於我們',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	});

	app.get('/aboutUs', (req, res) => {
		res.render('aboutUs', {
			title: '關於我們',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	});

	app.get('/activity', (req, res) => {
		let page = req.query.p ? parseInt(req.query.p) : 1;
		actPost.getLimit(null, page, 6, (err, posts, total) => {
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

	app.get('/activity/:id', (req, res) => {
		actPost.get(req.params.id, (err, post) => {
			if(err) {
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

	app.get('/activity/SignUp/:id', (req, res) => {
		actPost.take(req.params.id, (err, post) => {
			let date = new Date();
			date = date.getTime();
			if(err) {
				console.log(err);
				return res.redirect('/');
			}else if((post.ACT_B_BEG < date) && (post.ACT_B_END > date)) {
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
		actPost.take(req.params.id, function(err, actPost) {
			if(err)
				console.log(err);
			else if(actPost.ACT_B_BEG < new Date().getTime() < actPost.ACT_B_END) {
				let date = new Date().getTime();
				actSignUp.check(req.body.LIST_PER, function(err, sign) {
					if(err) {
						console.log(err);
						return res.redirect('/');
					}else if(sign) {
						req.flash('error', '重複報名！！');
						return res.redirect('/activity/SignUp/' + req.params.id);
					} else {
						let activitysignUp = new actSignUp(
							req.body.LIST_ACT_ID,
							req.body.LIST_KIND,
							req.body.LIST_PER,
							req.body.LIST_CNAME,
							req.body.LIST_IDNO,
							req.body.LIST_BIRTH,
							req.body.LIST_TEL,
							req.body.LIST_OCCUP,
							req.body.LIST_SEX,
							req.body.LIST_ADDR
						)

						activitysignUp.save((err) => {
							if(err) {
								console.log(err);
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

	app.get('/team', (req, res) => {
		let page = req.query.p ? parseInt(req.query.p) : 1;

		Team.getLimit(null, page, 6, (err, teams, total) => {
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

	app.get('/team/:id', (req, res) => {
		Team.get(req.params.id, (err, team) => {
			if(err) {
				console.log(err);
				return res.redirect('/');
			}
			if(!team) {
				req.flash('error', '隊伍不存在');
				return res.redirect('/');
			}
			achi.getByTeam(team.name, (err, doc) => {
				if(err)
					return res.redirect('/');
				else
					res.render('team', {
						title: team.name,
						teams: team,
						achievement: JSON.stringify(doc),
						user: req.session.user,
						success: req.flash('success').toString(),
						error: req.flash('error').toString()
					});
			});
		});
	});

	app.get('/leader/:id', (req, res) => {
		Leader.get(req.params.id, (err, leader) => {
			if(err) {
				return res.redirect('/');
			}
			res.render('leader', {
				title: '隊長介紹',
				user: req.session.user,
				leader: leader,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
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
	app.get('/map', (req, res) => {
		res.render('googleMap', {
			title: 'googleMap',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	
	app.get('/photo', (req, res) => {
		const myPath = process.cwd() + '/public/upload';
		fs.readdir(myPath, function (err, files) {
			res.render('photo', {
				title: '相簿',
				files: files,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
}