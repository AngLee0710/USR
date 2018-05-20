const mongoose = require('mongoose');
module.exports = {
	user: mongoose.createConnection('mongodb://workUser:123456@45.63.0.92:27017/work?ssh=true'),
	owner: mongoose.createConnection('mongodb://workOwner:2842l3u03@45.63.0.92:27017/work?ssh=true')
}