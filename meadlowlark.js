var http = require('http');
var fortune = require('./lib/fortune.js');
var formidable = require('formidable');
var jqupload = require('jquery-file-upload-middleware');
var express = require('express');

var app = express();

//設定handlebars view引擎
var handlebars = require('express3-handlebars').create({
	defaultLayout: 'main',
	extname: '.hbs',
	helpers: {
		section: function(name, options){
			if(!this._sections) this._sections = {};
			this._sections[name] = options.fn(this);
			return null;
		}
	}
});

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next){
	res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
	next();
});

app.use(function(req, res, next){
	if(!res.locals.partials) res.locals.partials = {};
	res.locals.partials.weather = getWeatherData();
	next();
})

app.use(require('body-parser')());

// app.use(function(req, res, next){
// 	res.locals.flash = res.session.flash;
// 	delete req.session.flash;
// 	next();
// });



app.get('/newsletter', function(req, res){
	res.render('newsletter', { csrf: 'CSRF token goes here' });
})

app.post('/newsletter', function(req, res){
	var name = req.body.name || '',
		email = req.body.email || '';

	//輸入驗證
	if(!email.match(VALID_EMAIL_REGEX)){
		if(req.xhr) return res.json({ error: 'Invalid name email address.'})
		req.session.flash = {
			type: 'danger',
			intro: 'Validation error!',
			message: 'The email address you entered was a valid.',
		};
		return res.redirect(303, '/newsletter/archive');
	}

	new NewsletterSignup({name: name, email: email}).save(function(err){
		if(err){
			if(req.xhr) return res.json({error: 'Database error'});
			req.session.flash = {
				type: 'danger',
				intro: 'Database error!',
				message: 'There was a database error; please try again later.',
			};
			return res.redirect(303, '/newsletter/archive');
		}
		if(req.xhr) return res.json({ success: true})
		req.session.flash = {
			type: 'success',
			intro: 'Thank you!',
			message: 'You have now been signed up for the newsletter.',
		};
		return res.redirect(303, '/newsletter/archive');
	})
})

app.post('/process', function(req, res){
	if(req.xhr || req.accepts('json, html') === 'json'){
		//if error, 傳送{error: 'error description'}
		res.send({success: true});
	} else {
		res.redirect(303, '/thank-you');
	}
})

app.get('/', function(req, res){
	res.render('home');
});

app.get('/about', function(req, res){
	res.render('about', {
		fortune: fortune.getFortune(),
		pageTestScript: '/qa/tests-about.js'
	});
});

app.get('/nursery-rhyme', function(req, res){
	res.render('nursery-rhyme');
});

app.get('/data/nursery-rhyme', function(req, res){
	res.json({
		animal: 'squirrel',
		bodyPart: 'tail',
		adjective: 'bushy',
		noun: 'heck',
	});
});

app.get('/tours/hood-river', function(req, res){
	res.render('tours/hood-river');
});
app.get('/tours/request-group-rate', function(req, res){
	res.render('tours/request-group-rate');
});

app.get('/contest/vacation-photo', function(req, res){
	var now = new Date();
	res.render('contest/vacation-photo', {
		year: now.getFullYear(),
		month: now.getMonth()
	});
});

var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

app.post('/contest/vacation-photo/:year/:month', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		if(err) return res.redirect(303, '/error');
		if(err){
			res.session.flash = {
				type: 'danger',
				intro: 'Oops!',
				message: 'There was an error processing your submission. ' + 'Please try again.',
			};
			return res.redirect(303, '/contest/vacation-photo');
		}
		var photo = files.photo;
		var dir = vacationPhotoDir + '/' + photo.name;
		var path = dir + '/' + photo.name;
		fs.mkdirSync(dir);
		fs.renameSync(photo.path, dir + '/' + photo.name);
		saveContestEntry('vacation-photo', fields.email, req.params.year, req.params.month, path);
		req.session.flash = {
			type: 'success',
			intro: 'Good luck!',
			message: 'You have been entered into the contest.',
		}
		return res.redirect(303, '/contest/vacation-photo/entries');
	});
});

app.use('/upload', function(req, res, next){
	var now = Date.now();
	jqupload.fileHandler({
		uploadDir: function(){
			return __dirname + '/public/uploads' + now;
		},
		uploadUrl: function(){
			return '/uploads/' + now;
		}
	})(req, res, next);
});

app.post('/cart/checkout', function(req, res){
	var cart = req.session.cart;
	if(!cart) {
		next(new Error('Cart does not exist.'));
	}
	var name = req.body.name || '',
		email = req.body.email || '';

	//輸入驗證
	if(!email.match(VALID_EMAIL_REGEX)) {
		return res.next(new Error('Invalid email address.'));
	}
	cart.number = Math.random().toString().replace(/^0\.0*/, '');
	cart.billing = {
		name: name,
		email: email,
	};
	res.render('email/cart-thank-you', {layout: null, cart: cart}, function(err, html){
		if(err) {
			console.log('error in email template');
		}
		mailTransport.sendMail({
			from: '"Meadowlark Travel": info@meadowlark.com',
			to: cart.billing.email,
			subject: 'Thank you for Book your Trip with Meadowlark',
			html: html,
			generateTextFromHtml: true
		}, function(err){
			if(err) {
				console.error('Unable to send confirmation: ' + err.stack);
			};
		});
	});
	res.render('cart-thank-you', {cart: cart});
})

//自訂404頁面
app.use(function(req, res, next){
	res.status(404);
	res.render('404');
});

//自訂500頁面
app.use(function(err, req, res, next){
	console.log(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
	console.log('Express started on http://localhost:' + app.get('port') + '; press ctrl-c to terminate.');
});
// function startServer(){
// 	http.createServer(app).listen(app.get('port'), function(){
// 		console.log('Express started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.')
// 	});
// };

// if(require.main === module){
// 	startServer();
// } else {
// 	module.exports = startServer;
// }


switch(app.get('env')){
	case 'development':
		app.use(require('morgan')('dev'));
		break;
	case 'production':
		app.use(require('express-logger')({
			path: __dirname + '/log/requests.log'
		}));
		break;
}

// mocked weather data
function getWeatherData(){
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
            },
            {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
            },
            {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)',
            },
        ],
    };
}