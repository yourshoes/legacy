/**
 * Module dependencies.
 */
var express = require('express')
  , passport = require('passport')
  , user = require('./user')
  , util = require('./utils')
  , mongoose = require('mongoose')
  , session = require('./session');

// Express configuration
  
var app = express();

//Development == default mode
app.configure(function(){

    app.set('view engine', 'ejs');
    
    //app.use(express.logger("dev"));
    //NOT verbose 
    app.use(express.logger("tiny"));
    app.locals.compileDebug = false;
    
    app.use(express.cookieParser(session.secret));
    app.use(express.bodyParser());
    app.use(express.session({key:'ssoss.ssid', cookie: {maxAge: 3600 * 1000 * 24 * 365, path: '/',  httpOnly: true, secure: true, signed:true } }));
    //app.use('/webtop',express.static(__dirname + '/../ssos-c/'));
    //app.use('/',express.static(__dirname + '/../ssos-c/'));
    
    //app.use('/resources',express.static(__dirname+'/resources'));
    app.use('/public',express.static(__dirname+'/../public/'));
  
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.errorHandler({ dumpExceptions: false, showStack: true }));
    
    mongoose.connect('mongodb://localhost/ssoss');
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


/*
##################################################
##################################################


    OAUTH 2.0 SERVER


##################################################
##################################################
*/

//Passport strategies configuration
var oauth = require('./oauth/conf')
    ;

/* 
    The Authorization endpoint 

    if user is logged in, redirect to authorization desicion
    if user is not logged in, redirect to login screen

    Example: http://localhost:3000/oauth/authorize?redirect_uri=http://www.ejemplo.com&client_id=abc123&response_type=code
*/
app.get('/oauth/authorize', oauth.authorization);

/*
    Login screen
    
    Displays a login screen and if success redirect user to /oauth/authorize
*/
app.get('/oauth/login', oauth.loginForm);
app.post('/oauth/login', oauth.login);

/*
    Authorization desicion endpoint
    
    If user accepts, it sends back to redirect_uri the authorization_code 
    If user denies, it sends back to redirect_uri the error info
*/
app.post('/oauth/dialog', oauth.decision);


/*
    Token endpoint
    
    waits for: authorization_code, redirect_uri, client_id, client_secret and grant_type
*/
app.post('/oauth/token', oauth.token);

/*
##################################################
##################################################


    RESOURCES SERVER


##################################################
##################################################
*/

/*
##################################################
##################################################


    SSOS-C SERVER


##################################################
##################################################
*/

/*
Generate privatekey.key and certificate.crt
openssl genrsa -out ssoss.key 1024 
openssl req -new -key ssoss.key -out certrequest.csr
openssl x509 -req -in certrequest.csr -signkey ssoss.key -out ssoss.crt
*/
var fs = require('fs')
    ,privateKey  = fs.readFileSync(__dirname+'/ssl/ssoss.key').toString()
    ,certificate = fs.readFileSync(__dirname+'/ssl/ssoss.crt').toString()
    ,server = require('https').createServer({key: privateKey, cert: certificate}, app)
    ,io = require('socket.io').listen(server)
    ;

require('./io')(io);

app.get('/',[session.balancer, session.restore, session.create]);

module.exports = server;
