/**************************************************************************

Module dependencies.
 
**************************************************************************/
var fs      = require('fs');
var sys     = require('sys');
var exec    = require('child_process').exec;

/**************************************************************************

Constants
 
**************************************************************************/
var DEBUG = true;
var UPLOAD_PATH = __dirname + '/../../../client/app/uploaded/';

/**************************************************************************

Utils functions
 
**************************************************************************/

exports.upload = function(req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var img = req.body
            , data = img['data'].substr(img['data'].indexOf('base64') + 7)//regex = /^data:.+\/(.+);base64,(.*)$/
            //, matches = img['data'].match(regex)
            , decodedImage = new Buffer(data, 'base64')//decodedImage = new Buffer(matches[2], 'base64')
            , name = (new Date().getTime()).toString(36)+'_'+img['name']
            , relative = '/static/uploaded/'+name
            , absolute = UPLOAD_PATH+name
            ;

        fs.writeFile(absolute, decodedImage, function(err) {
        
            if(err)
            {
                return next(err);
            }
        
            res.send(relative);
        });
    }
    else
    {
        res.send(401);
    }
    
};

/*exports.deletePhoto = function(req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var relative = req.body.replace("static/uploaded/","")
            , absolute = __dirname + '/../../../client/app/uploaded/'+relative
            ;

            //var data = img['data'].substr(img['data'].indexOf('base64') + 7);
            //decodedImage = new Buffer(data, 'base64')
        require('fs').unlink(absolute, function (err) {
          
          if (err) next(err);
          res.send(200);
        
        });
    }
    else
    {
        res.send(401);
    }
    
};*/

exports.UtilsShutdown = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {   
        exec('shutdown -h now', function (error, stdout, stderr) { sys.puts(stdout); res.send(true); });
    }
    else
    {
        res.send(401);
    }
};