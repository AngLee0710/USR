"use strict";
const crypto = require('crypto');
const multer  = require('multer');
const fs = require('fs');

const User = require('../models/user.js');
const Team = require('../models/team.js');
const actPost = require('../models/activity.js');
const Leader = require('../models/leader.js');

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

	//test-start
	app.get('/test', (req, res) => {
		actPost.getLimit(null, 1, 6, (err, actPost, total) => {
			res.render('test', {
				title: 'tttt',
				user: req.session.user,
				actPost: JSON.stringify(actPost),
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			})
		});
	});

	//test-end

	app.get('/aboutUs', (req, res) => {
		res.render('aboutUs', {
			title: '關於我們',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	});

	app.get('/connectUs', (req, res) => {
		res.render('connectUs', {
			title: '聯絡我們',
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

	app.get('/activity/:title/:day', (req, res) => {
		actPost.get(req.params.title, req.params.day, (err, post) => {
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

	app.get('/team/:name', (req, res) => {
		Team.get(req.params.name, (err, team) => {
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

	app.get('/leader/:nick', (req, res) => {
		Leader.get(req.params.nick, (err, leader) => {
			res.render('leader', {
				title: '隊長介紹',
				user: req.session.user,
				leader: leader,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
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