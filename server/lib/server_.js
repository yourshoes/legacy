/**
 * Module dependencies.
 */
var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var app = express();

//Development == default mode
app.configure(function(){

    app.set('view engine', 'ejs');

    //NOT verbose
    app.use(express.logger("tiny"));
    app.locals.compileDebug = false;
    app.use(express.errorHandler({ dumpExceptions: false, showStack: true }));

    //Cookie and sessions
    app.use(express.cookieParser('DJvon8HevhYXncr8ryGboE4r'));
    //app.use(express.cookieParser('DJvon8HevhYXncr8ryGboE4r'));
    //Limit upload to 4 Mbytes
    app.use(express.limit('5mb'));
    app.use(express.bodyParser());
    app.use(express.session({key:'kalzate.ssid'}));

    //app.use(express.session({key:'kalzate.ssid', cookie: {maxAge: 3600 * 1000 * 24 * 365, path: '/',  httpOnly: true, secure: true, signed:true } }));

    //Static
    //Delete on production
    app.use('/static', express.static(__dirname + './../client/app'));

    //Authentication
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);

    //DataBase
    mongoose.connect('mongodb://localhost/kalzate?poolSize=10');
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
});

//Production mode
app.configure('production', function(){

    //echo export NODE_ENV=production >> ~/.bash_profile
    //$ source ~/.bash_profile

    //console.log(process.env.NODE_ENV) //-> production
    //npm install connect-redis
    //var RedisStore = require('connect-redis')(express);
    app.use(express.session({ key:'ssoss.ssid', store: new RedisStore({host:'127.0.0.1', port:6380, prefix:'chs-sess'}), secret: '', cookie: { path: '/',  httpOnly: true, secure: true } }));
});

var actions = require('./api/actions');

app.post('/api/print', actions.print);

app.post('/api/login', actions.login);

app.post('/api/logout', actions.logout);

app.post('/api/register', actions.createUser);

app.post('/api/recover', actions.recoverUser);

app.post('/api/user/edit', actions.editUser);

app.post('/api/upload', actions.upload);

app.post('/api/shoes/add', actions.AddShoes);
app.post('/api/shoes/import', actions.ImportShoes);
app.get('/api/shoes/export/csv', actions.ExportShoesCsv);
app.get('/api/shoes/export/pdf', actions.ExportShoesPdf);
app.post('/api/shoes/fields', actions.GetShoesFields);
app.post('/api/shoes/qr', actions.getQR);
app.post('/api/shoes/barcode', actions.getBarCode);
app.post('/api/shoes/remove', actions.RemoveShoe);
app.get('/api/shoes/get/:id', actions.GetShoe);
app.post('/api/shoes/edit/:id', actions.EditShoe);
app.post('/api/shoes', actions.GetShoes);

app.post('/api/ticket/new', actions.newTicket);
app.post('/api/ticket/update', actions.updateTicket);
app.post('/api/ticket/order', actions.orderTicket);
app.post('/api/ticket/save', actions.saveTicket);
app.post('/api/ticket/return', actions.returnTicket);
app.post('/api/ticket/abort', actions.abortTicket);
app.post('/api/ticket/getFields', actions.GetFieldsForTIckets);
app.post('/api/ticket/getByCode', actions.GetTicket);
app.post('/api/ticket/get/sessionTicket', actions.GetSessionTicket);
app.post('/api/tickets/get', actions.GetTickets);

app.post('/api/box/get', actions.GetBox);

app.post('/api/utils/shutdown', actions.UtilsShutdown);

app.get('/api/backup', actions.Backup);

app.post('/api/ticket/voucher/validate', actions.ValidateVoucher);

app.get('/*', actions.index);

/*
var currentToken;
app.post('/auth', function(req, res) {

  var body = req.body,
      username = body.username,
      password = body.password;

    console.log(username,password);
  if (username == 'user' && password == 'casts') {
    // Generate and save the token (forgotten upon server restart).
    currentToken = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var role = userRoles.employee, username = 'user';
    var usr = JSON.stringify({
        'username': username,
        'role': role
    });
    res.cookie('kz-user', usr);
    res.send(usr);
  } else {
    res.send(401);
  }
});


function validTokenProvided(req, res) {

  // Check POST, GET, and headers for supplied token.
  var userToken = req.body.token || req.param('token') || req.headers['x-authentication-token'];

  if (!currentToken || userToken != currentToken) {
    res.send(401, { error: 'Invalid token. You provided: ' + userToken });
    return false;
  }

  return true;
}

app.get('/items', function(req, res) {
  if (validTokenProvided(req, res)) {
    console.log('enviando');
    res.send(ARTICLES);
  }
});

// Returns URL to pic of the day.
app.get('/photos.json', function(req, res) {
  if (validTokenProvided(req, res)) {
    res.send(PHOTOS);
  }
});

app.get('/photos.json', function(req, res) {
  if (validTokenProvided(req, res)) {
    res.send(PHOTOS);
  }
});

*/

module.exports = app;
