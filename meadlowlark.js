var express = require('express');

var app = express();

//設定handlebars view引擎
var handlebars = require('express3-handlebars').create({defaultLayout: 'main'});

var fortunes = [
	"Conquer your fears or they will conquer you.",
	"Rivers needs springs.",
	"Do not fear what you don't know.",
	"You will have a pleasant surprise.",
	"Whenever possible, keep it simple."
]

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.render('home');
});

app.get('/about', function(req, res){
	var randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
	res.render('about', {fortune: randomFortune});
});

//自訂404頁面
app.use(function(req, res, next){
	res.status(404);
	res.render('404');
});

//自訂500頁面
app.use(function(err, req, res, next){
	console.log(err.stack);
	res.status(500);
	res.render('505');
});

app.listen(app.get('port'), function(){
	console.log('Express started on http://localhost:' + app.get('port') + '; press ctrl-c to terminate.');
})

