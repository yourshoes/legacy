/**
 * Module dependencies.
 */
var express = require('express')
  , passport = require('passport')
  , mongoose = require('mongoose')
  , app = express()
  ;

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

var user_actions    = require('./api/user');
var store_actions   = require('./api/store');
var sales_actions   = require('./api/sales');
var util_actions    = require('./api/util');

app.post('/api/login', user_actions.login);
app.post('/api/logout', user_actions.logout);
app.post('/api/register', user_actions.createUser);
app.post('/api/recover', user_actions.recoverUser);
app.post('/api/user/edit', user_actions.editUser);

app.get('/api/shoes/export/csv', store_actions.ExportShoesCsv);
app.get('/api/shoes/export/pdf', store_actions.ExportShoesPdf);
app.get('/api/shoes/get/:id', store_actions.GetShoe);
app.post('/api/shoes/add', store_actions.AddShoes);
app.post('/api/shoes/import', store_actions.ImportShoes);
app.post('/api/shoes/fields', store_actions.GetShoesFields);
app.post('/api/shoes/qr', store_actions.getQR);
app.post('/api/shoes/barcode', store_actions.getBarCode);
app.post('/api/shoes/remove', store_actions.RemoveShoe);
app.post('/api/shoes/edit/:id', store_actions.EditShoe);
app.post('/api/shoes', store_actions.GetShoes);

app.get('/api/backup', sales_actions.Backup);
app.post('/api/ticket/new', sales_actions.newTicket);
app.post('/api/ticket/update', sales_actions.updateTicket);
app.post('/api/ticket/order', sales_actions.orderTicket);
app.post('/api/ticket/save', sales_actions.saveTicket);
app.post('/api/ticket/return', sales_actions.returnTicket);
app.post('/api/ticket/abort', sales_actions.abortTicket);
app.post('/api/ticket/getFields', sales_actions.GetFieldsForTIckets);
app.post('/api/ticket/getByCode', sales_actions.GetTicket);
app.post('/api/ticket/get/sessionTicket', sales_actions.GetSessionTicket);
app.post('/api/tickets/get', sales_actions.GetTickets);
app.post('/api/ticket/voucher/validate', sales_actions.ValidateVoucher);
app.post('/api/box/get', sales_actions.GetBox);

app.post('/api/upload', util_actions.upload);
app.post('/api/utils/shutdown', util_actions.UtilsShutdown);

app.get('/*', user_actions.index);

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
