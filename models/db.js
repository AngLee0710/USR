const mongoose = require('mongoose');
module.exports = {
	user: mongoose.createConnection('mongodb://workUser:123456@localhost:27017/work?ssh=true'),
	owner: mongoose.createConnection('mongodb://workOwner:2842l3u03@localhost:27017/work?ssh=true')
}