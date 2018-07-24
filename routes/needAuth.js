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
			res.redirect('/admin');
		});
	});

	app.get('/admin', checkLogin);
	app.get('/admin', (req, res) => {
		res.redirect('/teamManage');
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
				req.flash('error', '模組異常!!');
				return res.redirect('/activityManage');				 
			} else if(!team) {
				req.flash('error', '未輸入隊伍');
				return res.redirect('/activityManage');	
			} else {
				let ACT_BEG_DATE = req.body.ACT_BEG_DATE_D + ' ' + req.body.ACT_BEG_DATE_T;
				let ACT_END_DATE = req.body.ACT_END_DATE_D + ' ' + req.body.ACT_END_DATE_T;
				let ACT_B_BEG = req.body.ACT_B_BEG_D + ' ' + req.body.ACT_B_BEG_T;
				let ACT_B_END = req.body.ACT_B_END_D + ' ' + req.body.ACT_B_END_T;
				let ACT_COMM_USER, ACT_COMM_TEL, ACT_COMM_EMAIL = null;
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
				
				ACT_COMM_USER = team.connection.name;
					ACT_COMM_TEL = team.connection.phone;
					ACT_COMM_EMAIL = team.connection.email;
				
				let activityPost = new actPost(
					req.body.ACT_SUBJ_NAME,
					ACT_BEG_DATE_POCH,
					ACT_END_DATE_POCH,
					req.body.ACT_DEPTNAME,
					ACT_LOCATION,
					req.body.ACT_LIMIT_SEX,
					req.body.ACT_LIMIT,
					req.body.ACT_URL,
					ACT_COMM_USER,
					ACT_COMM_TEL,
					ACT_COMM_EMAIL,			
					ACT_B_BEG_POCH,
					ACT_B_END_POCH,
					req.body.ACT_K_TEL,
					req.body.ACT_K_DEPT,
					req.body.ACT_K_OCCUP,
					req.body.ACT_K_IDNO,
					req.body.ACT_K_SEX,
					req.body.ACT_K_BIRTH,
					req.body.ACT_K_FOOD,
					req.body.ACT_K_ADDR,
					req.body.ACT_LIST,
					imgArray,
					ACT_NOT_SIGN
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
		let ACT_COMM_USER = null;
		let ACT_COMM_TEL = null;
		let ACT_COMM_EMAIL = null;
		let ACT_LOCATION = {
			LOCATION_NAME: req.body.ACT_LOCATION_NAME,
			LOCATION_ADDR: req.body.ACT_LOCATION_ADDR,
			LOCATION_LAT: req.body.ACT_LOCATION_LNG,
			LOCATION_LNG: req.body.ACT_LOCATION_LAT
		}


		if(!ACT_NOT_SING) {
			let activityPost = {
				ACT_SUBJ_NAME: req.body.ACT_SUBJ_NAME,
				ACT_BEG_DATE: ACT_BEG_DATE_POCH,
				ACT_END_DATE: ACT_END_DATE_POCH,
				ACT_DEPTNAME: req.body.ACT_DEPTNAME,
				ACT_LOCATION: ACT_LOCATION,
				ACT_LIMIT_SEX: req.body.ACT_LIMIT_SEX,
				ACT_LIMIT: req.body.ACT_LIMIT,
				ACT_URL: req.body.ACT_URL,
				ACT_COMM_USER: ACT_COMM_USER,
				ACT_COMM_TEL: ACT_COMM_TEL,
				ACT_COMM_EMAIL: ACT_COMM_EMAIL,			
				ACT_B_BEG: ACT_B_BEG_POCH,
				ACT_B_END: ACT_B_END_POCH,
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

			console.log(ACT_LIST)

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
		} else {
			Team.check(req.body.ACT_DEPTNAME, (err, team) => {
				if(err) {
					console.log(err);
					return res.redirect('/activityManage');
				} else {
					ACT_COMM_USER = team.connection.name;
					ACT_COMM_TEL = team.connection.phone;
					ACT_COMM_EMAIL = team.connection.email;
					let activityPost2 = {
						ACT_SUBJ_NAME: req.body.ACT_SUBJ_NAME,
						ACT_BEG_DATE: ACT_BEG_DATE_POCH,
						ACT_END_DATE: ACT_END_DATE_POCH,
						ACT_DEPTNAME: req.body.ACT_DEPTNAME,
						ACT_LOCATION: ACT_LOCATION,
						ACT_LIMIT_SEX: req.body.ACT_LIMIT_SEX,
						ACT_LIMIT: req.body.ACT_LIMIT,
						ACT_URL: req.body.ACT_URL,
						ACT_COMM_USER: ACT_COMM_USER,
						ACT_COMM_TEL: ACT_COMM_TEL,
						ACT_COMM_EMAIL: ACT_COMM_EMAIL,			
						ACT_B_BEG: ACT_B_BEG_POCH,
						ACT_B_END: ACT_B_END_POCH,
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
		}
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
	app.post('/teamCreate', upload.any(), (req, res) => {
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
	app.post('/team/edit', upload.any(), (req, res) => {
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

		console.log(team);
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
		
		if(key) {
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
		} else {
			let update = {
				ACHI_STORE: req.body.ACHI_DEP,
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