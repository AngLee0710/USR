const express = require('express');
const path = require('path');

const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const flash = require('connect-flash');
const mongoose = require('mongoose');

const routes = require('./routes/index');
const needAuth = require('./routes/needAuth')
const settings = require('./settings');
const app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); //指定範本引擎為 ejs

app.use(flash());

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join( __dirname, 'public' )));

app.use(session({
	secret: settings.cookieSecret,
	key: settings.db, //cookie name
	cookie: {maxAge: 3 * 60 * 60 * 1000}, //30days
	store: new MongoStore({
		db: settings.db,
		host: settings.host,
		port: settings.port,
		url: 'mongodb://workOwner:2842l3u03@45.63.0.92:27017/work'
	})
}));

routes(app);
needAuth(app);

app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});