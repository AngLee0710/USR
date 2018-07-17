"use strict";
const crypto = require('crypto');
const multer  = require('multer');
const fs = require('fs');
const cheerio = require('cheerio');

const User = require('../models/user.js');
const Team = require('../models/team.js');
const actPost = require('../models/activity.js');
const Leader = require('../models/leader.js');
const achi = require('../models/achievement.js')

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

	app.get('/admin', checkLogin);
	app.get('/admin', (req, res) => {
		res.redirect('/activityManage');
	});

	app.get('/logout', checkLogin);
	app.get('/logout', (req, res) => {
		req.session.user = null;
		return res.redirect('/');
	});
	//
	//活動
	//
	app.get('/activityManage', checkLogin);
	app.get('/activityManage', (req, res) => {
		let page = req.query.p ? parseInt(req.query.p) : 1;
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

	app.post('/activity/create', checkLogin);
	app.post('/activity/create', (req, res, next) => {
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
				req.flash('error', 'Server model error !!');
				return res.redirect('/activityManage');				 
			} else if(!team) 
				req.flash('error', '未指定隊伍');
			else {
				let ACT_BEG_DATE = req.body.ACT_BEG_DATE_D + ' ' + req.body.ACT_BEG_DATE_T,
				ACT_END_DATE = req.body.ACT_END_DATE_D + ' '	+ req.body.ACT_END_DATE_T,
				ACT_COMM_USER = team.connection.name,
				ACT_COMM_TEL = team.connection.phone,
				ACT_COMM_EMAIL = team.connection.email,
				ACT_B_BEG = req.body.ACT_B_BEG_D + ' ' + req.body.ACT_B_BEG_T,
				ACT_B_END = req.body.ACT_B_END_D + ' ' + req.body.ACT_B_END_T,
				ACT_LOCATION = {
					LOCATION_NAME: req.body.ACT_LOCATION_NAME,
					LOCATION_ADDR: req.body.ACT_LOCATION_ADDR,
					LOCATION_LAT: req.body.ACT_LOCATION_LAT,
					LOCATION_LNG:  req.body.ACT_LOCATION_LNG
				}
				let activityPost = new actPost(
					req.body.ACT_SUBJ_NAME,
					Date.parse(ACT_BEG_DATE),
					Date.parse(ACT_END_DATE),
					req.body.ACT_DEPTNAME,
					ACT_LOCATION,
					req.body.ACT_LIMIT_SEX,
					req.body.ACT_LIMIT,
					req.body.ACT_URL,
					ACT_COMM_USER,
					ACT_COMM_TEL,
					ACT_COMM_EMAIL,			
					Date.parse(ACT_B_BEG),
					Date.parse(ACT_B_END),
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
						req.flash('error', err);
						return res.redirect('/activityManage');
					} else {
						req.flash('success', '發布成功');
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
			actPost.edit(req.body.editID, activityPost, (err, errr) => {
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
		});
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
	//隊伍
	//
	app.get('/teamManage', checkLogin);
	app.get('/teamManage', (req, res) => {
		let page = req.query.p ? parseInt(req.query.p) : 1;
		Team.getLimit(null, page, 6, (err, teams, total) => {
			res.render('teamManage', {
				title: '團隊管理',
				user: req.session.user,
				teams: JSON.stringify(teams),
				page: page,
				isFirstPage: ((page - 1) == 0),
				isLastPage: (Number((page - 1) * 6 + teams.length) == Number(total)),
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});		
		});
	});

	app.post('/team/get', checkLogin);
	app.post('/team/get', (req, res) => {
		Team.take(req.body.data, (err, team) => {
			if(err){
				console.log(err);
				return res.redirect('/teamManage');
			} else {
				res.send(team);
			}
		});
	});

	app.post('/teamCreate', checkLogin);
	app.post('/teamCreate', upload.single('teamImg'), (req, res) => {
		let team = {
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
		}

		if(req.file)
			team.teamImg = '/upload/' + req.file.filename;

		let newTeam = new Team(team)

		Team.check(newTeam.name, (err, team) => {
			if(err) {
				console.log(err)
				return res.redirect('/teamManage');
			}else if(team){
				req.flash('error', '隊伍名稱已存在');
				return res.redirect('/teamManage');
			} else {
				newTeam.save((err) => {
					if(err) {
						console.log(err);
						return res.redirect('/teamManage');
						
					} else {
						req.flash('success', '隊伍創建成功');
						return res.redirect('/teamManage');
					}
				});
			}
		});
	});

	app.post('/team/edit', checkLogin);
	app.post('/team/edit', upload.single('editTeamImg'), (req, res) => {
		let team = {
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
		}
		if(req.file) 
			team.teamImg =  '/upload/' + req.file.filename;
		
		Team.edit(req.body.teamID, team, (err, team) => {
			if(team == 'success'){
				req.flash('success', '修改成功！！！');
				return res.redirect('/TeamManage');
			}
			else {
				console.log(err);
				return res.redirect('/TeamManage');
			}
		});
	});

	app.post('/team/delete', checkLogin);
	app.post('/team/delete', (req, res) => {
		Team.remove(req.body.data, (err) => {
			if(err == 'error')
				res.send('error');
			 else 
				res.send('success');
		});
	});

	//
	//成果
	//
	app.get('/achievementManage', checkLogin);
	app.get('/achievementManage', (req, res) => {
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

	app.post('/achievement/create', checkLogin);
	app.post('/achievement/create', upload.array('ACHI_DEP_IMG', 100), (req, res) => {
		let image = [];
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
					req.body.ACT_NAME,
					req.body.TEAM_NAME,
					act.ACT_BEG_DATE,
					act.ACT_END_DATE,
					act.ACT_LOCATION,
					image,
					req.body.ACHI_DEP
				)
				

				newAchi.save((err) => {
					if(err) {
						req.flash('error', err);
						return res.redirect('/achievementManage');
					} else {
						req.flash('success', '新增成功');
						return res.redirect('/achievementManage');
					}
				});
			}
		});
	});

	app.post('/achievement/edit', checkLogin);
	app.post('/achievement/edit', upload.array('ACHI_DEP_IMG', 100), (req, res) => {
		let image = [];
		let count = 0;
		let deleteImg = req.body.deleteImg.split(',');
		deleteImg.forEach((img, index) => {
			image[count] = {
				URL: img,
				NAME: img.split('/upload/')[1]
			}
			count++;
		});

		req.files.forEach((file, index) => {
			image[count] = {
				NAME: file.filename,
				URL: '/upload/' + file.filename
			}
			count++;
		});

		let update = {
			ACHI_STORE: req.body.ACHI_DEP,
			ACHI_IMG: image
		}

		achi.edit(req.body.ACHI_ID, update, (err) => {
			if(err)
				req.flash('error', '資料庫模組異常');
			else 
				req.flash('success', '修改成功');
			return res.redirect('/achievementManage');
		});
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
				res.send(doc);
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
	//函數
	//
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