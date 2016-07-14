/**************************************************************************

Module dependencies.

**************************************************************************/
var userDB          = require('../db/users');
var crypto          = require('crypto');
var passport        = require('passport');
var fs              = require('fs');
var nodemailer      = require('nodemailer');
var roles           = require('../../client/app/js/config').userRoles;
var printer 		= require('electron-printer');

require('../auth/conf');

/**************************************************************************

Constants

**************************************************************************/

var DEBUG               = true;
var INDEX_PATH          = '/../../client/app/index.html';
var SMTP_AUTH_USER      = 'tantestapp@gmail.com';
var SMTP_AUTH_PASSWD    = 'tantEsT@ _xoprt786371224y1';
var MAIL_FROM           = 'tantest@noreply.com';
var MAIL_SUBJECT        = 'KALZATE: Recupera Contraseña';
var MAIL_BODY           = '<p>Saludos,</p><br/><br/><p>tu nueva contraseña es: <strong>%s</strong></p>';
var PASSWD_PATTERN      = 'xxxxxxxx';//each 'x' will be replace with a random value

/**************************************************************************

User functions

**************************************************************************/


exports.index = function (req, res)
{
    fs.readFile(__dirname + INDEX_PATH, 'utf8', function(err, text){

        res.send(text);
    });

    //on production, index.html must be set directly
};


exports.print = function (req, res) {
    
    function toBytes(str) {
        var arr = []
        for (var i=0; i < str.length; i++) {
            arr.push(str[i].charCodeAt(0))
        }
        return arr;
    }

    //qz.appendHex("x1Bx40");
    var print = req.body.data;

    //var printData = print.content;
    var printData = toBytes(print.content).concat([0x1B, 0x69, 0x1B, 0x70, 0x00, 0x09, 0x09]);

    printer.printDirect({
        data: new Buffer(printData)
        //data: printData
        , printer: 'termica'
        , type: "RAW"
        , success:function(){
            res.send(200);
        }
        , error:function(err){

            console.error(err);
            res.send(404);

        }
    });
};

exports.login = [passport.authenticate('local'), function (req, res){

  res.send(200, {username:req.user['username'], role: roles[req.user['role']]});

}];

exports.logout = function(req, res)
{
    req.logout();
    return res.send(200);
};

exports.createUser = function(req, res, next){

    if(req.user)
    {
        //if(DEBUG) console.log('error?')
        return next(new Error());
    }

    var data = req.body
        ,user = new userDB({

        'email'     : data['email'],
        'username'  : (data['username']) ? data['username'] : data['email'].replace(/@.*/gi,''),
        'role'      : 'employee',
        'password'  : crypto.createHash('md5').update(data['password']).digest("hex")
    });

    //if(DEBUG) console.log('the user:',user);

    return user.save(function (err){

        if (err)
        {
            return next(err);
        }

        req.login(user, function (err) {

            if (err)
            {
                return next(err);
            }

            // if(DEBUG) console.log('error:',err);

            return res.send(200, {username:user['username'], role: roles[user['role']]});
        });

    });
};

exports.recoverUser = function(req, res, next){

    if(req.user)
    {
        //if(DEBUG) console.log('error?')
        return res.send(404);
    }


    var generated = PASSWD_PATTERN.replace(/[x]/g, function(c) {

            var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
            return v.toString(16);

        }),
        new_passwd = crypto.createHash('md5').update(generated).digest("hex");

    userDB.findOneAndUpdate(req.body,{password:new_passwd}, function (err, user){

        if(err || !user)
        {
            return res.send(404);
        }

        res.send(true);


        //Send email
        var mailOptions =
        {
            from: MAIL_FROM, // sender address
            to: req.body.email, // list of receivers
            subject: MAIL_SUBJECT, // Subject line
            //text: "Saludos, tu nueva contraseña es: "+generated+'', // plaintext body
            html: MAIL_BODY.replace('%s',generated) // html body
        }

        var smtpTransport = nodemailer.createTransport("SMTP",
        {
            service: "Gmail",
            auth:
            {
                user: SMTP_AUTH_USER,
                pass: SMTP_AUTH_PASSWD
            }
        });

        smtpTransport.sendMail(mailOptions,
        function(err, response)
        {
            //if(DEBUG) console.log(err,response);
            smtpTransport.close();
            //return res.send({access:0,result:{error:0}});
        });
    });
};

exports.editUser = function(req, res, next){

    if(req.user && req.user.role == 'employee')
    {
        var data = {};

        if(req.body.password)
        {
            data.password = crypto.createHash('md5').update(req.body.password).digest("hex");
        }

        if(req.body.username)
        {
            data.username = req.body.username;
        }

        //if(DEBUG) console.log(data, req.user['_id']);

        userDB.findOneAndUpdate(req.user['_id'], data, function (err, user){

            if(err || !user)
            {
                return res.send(404);
            }

            //req.user['username'] = user['username'];
            res.send(true);
        });

    }
    else
    {
        res.send(401);
    }
};
