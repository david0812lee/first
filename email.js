var nodemailer = require('nodemailer');

var mailTransport = nodemailer.createTransport('SMTP', {
	service: 'Gmail',
	auth: {
		user: credentials.gmail.user,
		pass: credentials.gmail.password,
	}
});

mailTransport.sendMail({
	from: '"Meadowlark Travel" <info@meadowlark.com>',
	to: 'david10426@hotmail.com',
	subject: 'Your Meadowlark Travel Tour',
	text: 'Thank you for booking your trip with Meadowlark Travel. We look forward to your visit!',
}, function(err){
	if(err) console.log('Unable to send email: ' + err);
});