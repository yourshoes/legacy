var nodemailer = require('nodemailer');
//Enviamos email

var dbfile = process.argv[2];

if(!dbfile)
{
    return;
}

require('fs').readFile(dbfile, function (err, data) {

    var mailOptions = 
    {
        from: "tantest@noreply.com", // sender address
        to: "prucheta@gmail.com", // list of receivers
        subject: "KALZATE DATABASE BACKUP ON:"+(new Date().toLocaleDateString()), // Subject line
        //text: "Saludos, tu nueva contraseña es: "+generated+'', // plaintext body
        html: 'Database backup', // html body,
        attachments : [{'filename': require('path').basename(dbfile),'contents':data}]
    }

    var smtpTransport = nodemailer.createTransport("SMTP",
    {
        service: "Gmail",
        auth: 
        {
            user: "tantestapp@gmail.com",
            pass: "tantEsT@ _xoprt786371224y1"
        }
    });

    smtpTransport.sendMail(mailOptions, 
    function(err, response)
    {
        //console.log('terminamos',err,response);
        smtpTransport.close(); 
        //return res.send({access:0,result:{error:0}});
    });

});