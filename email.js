var credentials = require('./credentials.js');
var emailService = require('./lib/email.js')(credentials);

emailService.send('david10426@hotmail.com', 'test', 'test');