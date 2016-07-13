/**
 * Module dependencies.
 */
var userDB = require('../db/users')
    , shoesDB = require('../db/shoes')
    , ticketsDB = require('../db/tickets')
    , crypto = require('crypto')
    , passport = require('passport')
    , fs = require('fs')
    , ObjectId = require('mongoose').mongo.BSONPure.ObjectID//.Types.ObjectId;

require('../auth/conf');

/*
|--------------------------------------------------------------------------
|User
|--------------------------------------------------------------------------
*/

var roles = require('../../../client/app/js/config').userRoles;

exports.index = function (req, res)
{
    fs.readFile(__dirname + '/../../../client/app/index.html', 'utf8', function(err, text){
        
        res.send(text);
    });

    //on production, index.html must be set directly
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
        //console.log('error?')
        return next(new Error());
    }

    var data = req.body
        ,user = new userDB({
    
        'email'     : data['email'],
        'username'  : (data['username']) ? data['username'] : data['email'].replace(/@.*/gi,''),
        'role'      : 'employee',
        'password'  : crypto.createHash('md5').update(data['password']).digest("hex")
    });

    //console.log('the user:',user);

    return user.save(function (err){

        if(err) return next(err);

        req.login(user, function (err) {
    
            if (err) { return next(err); }
            console.log('error:',err);
            return res.send(200, {username:user['username'], role: roles[user['role']]});
        });

    }); 
};

exports.recoverUser = function(req, res, next){

    if(req.user)
    {
        //console.log('error?')
        return res.send(404);
    }


    var generated = 'xxxxxxxx'.replace(/[x]/g, function(c) {
    
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

        var nodemailer = require('nodemailer');
        //Enviamos email
        var mailOptions = 
        {
            from: "tantest@noreply.com", // sender address
            to: req.body.email, // list of receivers
            subject: "KALZATE: Recupera Contraseña", // Subject line
            //text: "Saludos, tu nueva contraseña es: "+generated+'', // plaintext body
            html: '<p>Saludos,</p><br/><br/><p>tu nueva contraseña es: <strong>'+generated+'</strong></p>' // html body
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
            //console.log(err,response);
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

        //console.log(data, req.user['_id']);

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
/*
|--------------------------------------------------------------------------
|Shoes
|--------------------------------------------------------------------------
*/

exports.GetShoes = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var data = req.body;

        shoesDB
        .find(!data['search'] ? {} : data['search'],{reference:1, brand:1, size:1, category:1, color:1, quantity:1, price:1, images:1, has_qr:1, barcode:1}, {limit:data['limit'], skip:data['offset']})
        .sort(data['order'])
        .execFind(function (err, shoes){            
            
            if (err) 
            {
                return next(err);
            }

            shoesDB.count(!data['search'] ? {} : data['search'],function (err, count) {
            
                if (err) 
                {
                    return next(err);
                }

                res.send({count: count, items: shoes});

            });
            
            
        });
    }
    else
    {
        res.send(401);
    }
};

exports.GetShoe = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var id = req.param('id');

        shoesDB
        .findById(id, {qr:0, 'last-modified':0, history:0, sold:0}, function (err, shoe){            
            
            if (!shoe || err) 
            {
                return res.send(401);
            }

            res.send(shoe);
        });
    }
    else
    {
        res.send(401);
    }
};

exports.EditShoe = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var id = req.param('id');

        shoesDB
        .findByIdAndUpdate(id, {$set: req.body}, function(err, shoe){
        
            if (!shoe || err) 
            {
                 return res.send(401);
            }
            
            res.send(true);
        });
    }
    else
    {
        res.send(401);
    }
};

exports.AddShoes = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {

        var data = req.body
            ,shoe = new shoesDB(req.body);

        return shoe.save(function (err){

            if (err) return next(err);

            res.send(200, shoe);

        }); 
    }
    else
    {
        res.send(401);
    }
}

exports.ImportShoes = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        
        var data = req.body;

        if(data.remove)
        {
            var mongoose = require('mongoose');

            return mongoose.connection.db.dropCollection("shoes", function(err, result) {

                if(err) return next(err);

                return shoesDB.create(data.items, function (err){

                    if (err) return next(err);

                    res.send(true);

                });

            });
        }
        else
        {
            return shoesDB.create(data.items, function (err){

                if (err) return next(err);

                res.send(true);

            });
        }
        
    }
    else
    {
        res.send(401);
    }
};

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
            , absolute = __dirname + '/../../../client/app/uploaded/'+name
            ;

            //var data = img['data'].substr(img['data'].indexOf('base64') + 7);
            //decodedImage = new Buffer(data, 'base64')
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

exports.ExportShoesCsv = function(req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        shoesDB
        .find({}, function (err, shoes){            
            
            if (err) 
            {
                return next(err);
            }

            var json2csv = require('json2csv');

            json2csv({data: shoes, fields: ['reference','brand','color','size','quantity','category','price']}, function(err, csv) {
                
                if (err)
                {
                    return next(err);
                }

                res.attachment('zapatos.csv');
                res.setHeader('Content-Type', 'text/csv');
                res.end(csv);
            });
        });
    }
    else
    {
        res.send(401);
    }
    
};


exports.ExportShoesPdf = function(req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        /*
var fs = require('fs')
            ,path = __dirname + '/../../../client/app/barcodes/'
            ;

        if(fs.existsSync(path+'zapatos_barcodes.pdf'))
        {   
            return res.send({cache:true});
        }
        */
        shoesDB
        .find({},{reference:1,brand:1,color:1,size:1,barcode:1, quantity:1}, function (err, shoes){            
            
            if (err) 
            {
                return next(err);
            }

            var PDFDoc = require('pdfkit')
                ,doc = new PDFDoc({size:'A4', info:{title:'Kalzate Barcodes', author: 'Zurisadai'}})
                , path = __dirname + '/../../../client/app/barcodes/'
                ,barc = new (require('barc'))({fontsize:'16px'})
                ,x = 9
                ,y = 17
                ,text = []
                ,j
                ,imgPath
                ,t = 0
                ,in_c = 0
                ,total_length = shoes.length
                ;

            doc.fontSize(7);

            for(var i=0;i<shoes.length;i++)
            {
                //doc.text(shoes[i]['reference']+' | '+shoes[i]['brand']+' | '+shoes[i]['color']+' | '+shoes[i]['size']);

                imgPath = path+shoes[i]['barcode']+'.png';
                
                if(!fs.existsSync(imgPath))
                {
                    
                    try
                    {
                        
                        fs.writeFileSync(imgPath, barc.code128(shoes[i]['barcode'], 210, 110));
                    }
                    catch(e)
                    {
                        continue;
                    }
                }

                in_c = 0;

                if(shoes[i]['quantity'] > 1)
                {
                    total_length += shoes[i]['quantity']-1;
                }

                for(var h=1;h<=shoes[i]['quantity'];h++)
                {

                    doc
                    .image(imgPath, x, y, {width:210, height:110, fit:[180,120]})
                    ;

                    j = t+h;

                    //Columnas de  6 elementos
                    if(j % 6 == 0)//Nueva columna
                    {
                        //Let's print the text
                        long_text = shoes[i]['reference']+' | '+shoes[i]['brand']+' | '+shoes[i]['color']+' | '+shoes[i]['size']+' | '+h;

                        if(long_text.length > 48)
                        {
                            text.push(long_text.substr(0,48));
                            text.push(long_text.substr(48,long_text.length));
                        }
                        else
                        {
                           text.push(long_text); 
                        }

                        in_c = h;

                        y += 120;

                        for(var z=0;z<text.length;z++)
                        {
                            doc.text(text[z],x,y+(z*12));
                        }

                        text=[];
                        x += 200;
                        y = 17;
                    }
                    else//Nuevo elemento en la columna
                    {
                        y += 120;

                        if(h == shoes[i]['quantity'])
                        {
                            long_text = shoes[i]['reference']+' | '+shoes[i]['brand']+' | '+shoes[i]['color']+' | '+shoes[i]['size']+' | '+(h-in_c);

                            if(long_text.length > 48)
                            {
                                text.push(long_text.substr(0,48));
                                text.push(long_text.substr(48,long_text.length));
                            }
                            else
                            {
                               text.push(long_text); 
                            }    
                        }
                        //Si ya no quedan mas elementos, por ejemplo una columna de 4 elementos en vez de completa(6 elementos)
                        if(j==total_length)
                        {
                            for(var k=0;k<text.length;k++)
                            {
                                doc.text(text[k],x,y+(k*12));
                            }

                            doc
                            .moveTo(199,0).lineTo(199, 850).dash(3, {space: 5}).stroke()
                            .moveTo(399,0).lineTo(399, 850).dash(3, {space: 5}).stroke()
                            .moveTo(0,125).lineTo(600, 125).dash(3, {space: 5}).stroke()
                            .moveTo(0,245).lineTo(600, 245).dash(3, {space: 5}).stroke()
                            .moveTo(0,365).lineTo(600, 365).dash(3, {space: 5}).stroke()
                            .moveTo(0,485).lineTo(600, 485).dash(3, {space: 5}).stroke()
                            .moveTo(0,605).lineTo(600, 605).dash(3, {space: 5}).stroke()
                            .moveTo(0,725).lineTo(600, 725).dash(3, {space: 5}).stroke();
                        }
                    }

                    //Nuevo página
                    if(j % 18 == 0)
                    {
                        doc
                        .moveTo(199,0).lineTo(199, 850).dash(3, {space: 5}).stroke()
                        .moveTo(399,0).lineTo(399, 850).dash(3, {space: 5}).stroke()
                        .moveTo(0,125).lineTo(600, 125).dash(3, {space: 5}).stroke()
                        .moveTo(0,245).lineTo(600, 245).dash(3, {space: 5}).stroke()
                        .moveTo(0,365).lineTo(600, 365).dash(3, {space: 5}).stroke()
                        .moveTo(0,485).lineTo(600, 485).dash(3, {space: 5}).stroke()
                        .moveTo(0,605).lineTo(600, 605).dash(3, {space: 5}).stroke()
                        .moveTo(0,725).lineTo(600, 725).dash(3, {space: 5}).stroke();

                        doc.addPage();
                        text=[];
                        x = 9;
                        y = 17;
                    }
                }

                t += shoes[i]['quantity'];
            }

            doc.write(path+'zapatos_barcodes.pdf', function(){

                res.send(true);
            });

            
            
            /*doc.output(function(pdf){

                res.attachment('zapatos_barcodes.pdf');
                res.setHeader('Content-Type', 'text/pdf');
                res.end(pdf,'binary');
            })*/
            
        });
    }
    else
    {
        res.send(401);
    }
    
};

exports.GetShoesFields = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var data = req.body;

        shoesDB
        .distinct(data['field'])
        .exec(function (err, field) {       
            
            if (err) 
            {
                return next(err);
            }

            /*var matches = [];

            for(var i=0;i<references.length;i++)
            {
                if(references[i].indexOf(data['ref']) > -1)
                    matches.push(references[i]);
            }

            res.send(matches);*/
            res.send(field);
        });
    }
    else
    {
        res.send(401);
    }
};

exports.RemoveShoe = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {

        shoesDB
        .remove({ _id: req.body.id }, function (err) {       
            
            if (err) 
            {
                return next(err);
            }

            res.send(true);
            //req.body.field = 'reference';
            //return exports.GetShoesFields(req,res,next);
        });
    }
    else
    {
        res.send(401);
    }
};

exports.getQR = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var data = req.body;

        if(data['has_qr'])
        {
            shoesDB
            .findById(data['id'], {qr:1}, function (err, item) {       
                
                if (err) 
                {
                    return next(err);
                }
                console.log('no regenera');
                res.send({qr:item.qr});
            });
        }
        else
        {
            var QRCode = require('qrcode');

            QRCode.toDataURL('http://www.kalzate.es/qr/zapatos/ver/'+data['id'],function (err,dataURL){
                
                if (err) 
                {
                    return next(err);
                }

                shoesDB
                .findByIdAndUpdate(data['id'], {$set: {'qr':dataURL, 'has_qr':true}}, function(err, item){
                
                    if (err) 
                    {
                        return next(err);
                    }

                    console.log('regenera');
                    res.send({qr:item.qr});
                });
                
            });

            
        }
       
    }
    else
    {
        res.send(401);
    }
};

exports.getBarCode = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var bc = req.body['barcode']
            ,fs = require('fs')
            ,path = __dirname + '/../../../client/app/barcodes/'+bc+'.png'
            ,barc = new (require('barc'))({fontsize:'16px'})
            ,buf = barc.code128(bc, 210, 110)
            ;

        fs.writeFile(path, buf, function(err){
            
            if(err)
            {
                return res.send(404);
            }

            var base64data = new Buffer(buf).toString('base64');

            res.send("data:image/png;base64,"+base64data);
        });
        
    }
    else
    {
        res.send(401);
    }
};
/*
|--------------------------------------------------------------------------
|Tickets
|--------------------------------------------------------------------------
*/


exports.newTicket = function (req, res, next)
{

    if(req.user && req.user.role == 'employee')
    {
        var sessTicket = req.body['session'];
        //console.log(sessTicket);

        return ticketsDB.find({status:"EXPIRING"}, function (err, tickets) {

            //console.log('NEW-TICKET', err, tickets);

            if(!err && tickets.length)
            {   
                var numQueries = 0;

                return tickets.forEach(function(ticket,i){

                    //console.log(ticket,i);
                    if(sessTicket.indexOf(ticket['_id'].toString()) > -1)
                    {
                        //console.log('DEJAMOS AL TICKET TRANQUILO');
                        if(i+1 == tickets.length)
                        {
                            var newTicket = new ticketsDB({employee:req.user.username, employee_id:req.user._id});

                            newTicket.save(function (err){

                                if(err)
                                {
                                    return res.send(404);
                                }

                                return res.send(newTicket);
                            });
                        }

                        return;
                    }

                    //console.log('BORRAMOS EL TICKET');

                    for(var j = 0; j < ticket.products.length; j++) 
                    {
                        var product = ticket.products[j];

                        //console.log(product);

                        numQueries++;

                        shoesDB.update(
                        {
                            '_id': product['_id'],
                            'in_carts.id': ticket['_id'].toString(),
                            'in_carts.timestamp': product['ts'],
                            'in_carts.quantity': product['quantity']
                        },
                        {
                            $inc: {quantity: product['quantity']},
                            $set: {in_carts: {quantity:'', id: '', timestamp: ''}}
                        },
                        function (err, result){

                            //console.log('result', result);

                            if(err && !result)
                            {
                                console.log('ERROR AL ACTUALIZAR PRODUCTOS',err);
                                return res.send(404);
                            }

                            numQueries--;

                            if(numQueries == 0)
                            {
                                console.log('EXITO AL ACTUALIZAR TODOS LOS PRODUCTOS',err);

                                ticketsDB.remove({_id: ticket['_id']}, function (err){

                                    if(err)
                                    {
                                        return res.send(404);
                                    }

                                    if(tickets.length == i+1)
                                    {
                                        var newTicket = new ticketsDB({employee:req.user.username, employee_id:req.user._id});

                                        newTicket.save(function (err){

                                            if(err)
                                            {
                                                return res.send(404);
                                            }

                                            return res.send(newTicket);
                                        });
                                    }
                                    /*
                                    var newTicket = new ticketsDB({employee:req.user.username});

                                    newTicket.save(function (err){

                                        if(err)
                                        {
                                            console.log('ERROR AL CREAN NUEVO TICKET',err);
                                            return res.send(404);
                                        }
                                        console.log('EXITO AL CREAR TICKET');
                                        return res.send(newTicket);
                                    });
                                    */
                                });
                            }
                        });  
                    }

                    if(!ticket.products.length)
                    {
                        ticketsDB.remove({_id: ticket['_id']}, function (err){

                            if(err)
                            {
                                return res.send(404);
                            }

                            if(tickets.length == i+1)
                            {
                                var newTicket = new ticketsDB({employee:req.user.username, employee_id:req.user._id});

                                newTicket.save(function (err){

                                    if(err)
                                    {
                                        return res.send(404);
                                    }

                                    return res.send(newTicket);
                                });
                            }
                            /*
                            var newTicket = new ticketsDB({employee:req.user.username});

                            newTicket.save(function (err){

                                if(err)
                                {
                                    return res.send(404);
                                }

                                return res.send(newTicket);
                            });
                            */
                        });
                    }
                });
            }

            //if(!tickets){}
            var newTicket = new ticketsDB({employee:req.user.username, employee_id:req.user._id});

            newTicket.save(function (err){

                if(err)
                {
                    return res.send(404);
                }

                return res.send(newTicket);
            });
        });
    }
    else
    {
        res.send(401);
    }
};

exports.updateTicket = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var data = req.body;

        data['product']['ts'] = (new Date()).getTime();
        
        ticketsDB.update({'_id': data['_id'], 'status':'EXPIRING'}, { '$push': { 'products': data['product'] }}, function (err){

            if(err)
            {
                return res.send(404);//El producto no se ha añadido
            }


            shoesDB.update({'_id': data['product']['_id'], 'quantity': {'$gte': 0}}, 
            { $inc: {quantity: (data['product']['qa']-data['product']['quantity'])}, '$set': { in_carts: { quantity:data['product']['quantity'], id: data['_id'], timestamp: data['product']['ts']}}}, function (err){

                if(err)
                {
                    console.log('4',err);
                    return res.send(404);//El producto no se ha añadido
                }

                console.log('5',err);
                return res.send(true);
            });
        });
    }
    else
    {
        res.send(401);
    }

};

exports.orderTicket = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var data = req.body,
            moment = require('moment')
            ,ticketReceipt = '\r\n             ZAPATERIA KALZATE\r\n\r\nCC. La Trocha, Local 31. Tel. 951-315-150\r\n    Ctra Cartama, Coin, Malaga, 29100.\r\n\r\n'
            ,total = parseFloat(data['overview']['total']).toFixed(2)
            ,received = parseFloat(data['overview']['received'].replace(',','.')).toFixed(2)
            ,datetime = moment().format('DD/MM/YY HH:mm')
            ;

        ticketReceipt += ' Ticket: '+data['overview']['code']+'  Fecha: '+datetime+'\r\n\r\n Atendid@ por: '+req.user.username+'\r\n\r\n------------------------------------------\r\n Articulo              Ud.  PVP  Subtotal\r\n------------------------------------------\r\n';

        for(var i=0;i<data['products'].length;i++)
        {
            var desc;

            if(data['products'][i]['type'] == 's')
            {
                //Si se pasa de 25 lo suyo seria hacer una abreviacion
                //desc = (data['products'][i]['description'] > 25) ? data['products'][i]['abbr']:data['products'][i]['description'];
                desc = data['products'][i]['description'];
            }
            else
            {
                desc = data['products'][i]['reference']+', '+data['products'][i]['description'];
            }

            desc = (desc.length > 21) ? desc.substr(0,17)+'... ':desc+Array(22 - desc.length).join(' ');

            ticketReceipt += ' '+desc+' '+data['products'][i]['quantity']+'x  '+parseFloat(data['products'][i]['price']).toFixed(2)+'E  '+parseFloat(data['products'][i]['subtotal']).toFixed(2)+'E\r\n';
        }

        ticketReceipt += '------------------------------------------\r\n                          TOTAL:   '+total+'E\r\n';

        if(data['overview']['total_discount'])
        {
            ticketReceipt += ' CON DESCUENTO DEL '+( parseInt(data['overview']['discount']) <= 9 ? ' '+data['overview']['discount']:data['overview']['discount'] )+'%,   TOTAL:   '+data['overview']['total_discount']+'E\r\n';
        }

        ticketReceipt +='                          (IVA incluido)\r\n\r\n';

        switch (data['overview']['payment_method']) 
        {
            case 'cash':
                ticketReceipt += ' METODO: EFECTIVO,        ENTREGA: '+received+'E\r\n                          CAMBIO:  '+data['overview']['returned']+'E\r\n';
                break;
            case 'credit':
                ticketReceipt += ' METODO: T. CREDITO,      IMPORTE: '+total+'E\r\n';
                break;
            case 'voucher':
                ticketReceipt += ' METODO: VALE DESCUENTO,  IMPORTE: '+received+'E\r\n';
                if(received > total)
                {
                    ticketReceipt += '\r\n------------------------------------------\r\n\r\n      ESTE TICKET VALE POR '+Math.abs(received-total).toFixed(2)+' EUROS\r\n\r\n------------------------------------------\r\n';
                    ticketReceipt += '\r\n        VALIDO MAXIMO HASTA 6 MESES\r\n';
                    data['overview']['voucher'] = Math.abs(received-total).toFixed(2);
                }
                break;
            case 'phone':
                ticketReceipt += ' METODO: TELEFONO,        IMPORTE: '+total+'E\r\n';
                break;
            case 'combined':
                ticketReceipt += ' METODO: COMBINADO,     ';

                if(data['overview']['combined_cash'])
                {
                    ticketReceipt += '  EFECTIVO: '+data['overview']['combined_cash']+'E\r\n';

                    if(data['overview']['combined_credit'])
                    {
                        ticketReceipt += '                          T. CRED.: '+data['overview']['combined_credit']+'E\r\n';
                    }

                    if(data['overview']['combined_voucher'])
                    {
                        ticketReceipt += '                          V. DESC.: '+data['overview']['combined_voucher']+'E\r\n';
                    }
                }
                else if(data['overview']['combined_credit'])
                {
                    ticketReceipt += '  T. CRED.: '+data['overview']['combined_credit']+'E\r\n';

                    if(data['overview']['combined_cash'])
                    {
                        ticketReceipt += '                          EFECTIVO: '+data['overview']['combined_cash']+'E\r\n';
                    }

                    if(data['overview']['combined_voucher'])
                    {
                        ticketReceipt += '                          V. DESC.: '+data['overview']['combined_voucher']+'E\r\n';
                    }
                }
                else
                {
                    ticketReceipt += '  V. DESC.: '+data['overview']['combined_voucher']+'E\r\n';

                    if(data['overview']['combined_credit'])
                    {
                        ticketReceipt += '                          T. CRED.: '+data['overview']['combined_credit']+'E\r\n';
                    }

                    if(data['overview']['combined_cash'])
                    {
                        ticketReceipt += '                          EFECTIVO: '+data['overview']['combined_cash']+'E\r\n';
                    }
                }

                break;
        }

        ticketReceipt += '\r\n     DEVOLUCIONES MAXIMO HASTA 30 DIAS\r\n';
        ticketReceipt += '\r\n       *** GRACIAS POR SU VISITA ***\r\n\r\n';
        ticketReceipt += '-   -   -   -   -   -   -   -   -   -   -\r\n\r\n\r\n';

        //data['overview']['date'] = new Date();

        if(data['overview']['update_code'])
        {
            ticketsDB.update({'code': data['overview']['update_code']}, { '$set': { 'visible': false} }, function (err){

                    if(err)
                    {
                        return res.send(404);
                    }

                    ticketsDB.update({'_id': data['_id'], 'status':'EXPIRING'}, { '$set': { 'products': data['products'], 'overview':data['overview'], 'status':'VENDIDO', 'print':ticketReceipt, 'date_end':new Date() }}, function (err){

                        if(err)
                        {
                            return res.send(404);//El ticket no se ha finalizado
                        }

                        res.send(ticketReceipt);
                        
                    });
            });

        }
        else
        {
            //Obtenemos todos los productos, generamos el ticket impresion y actualizamos el ticket
            ticketsDB.update({'_id': data['_id'], 'status':'EXPIRING'}, { '$set': { 'products': data['products'], 'overview':data['overview'], 'status':'VENDIDO', 'print':ticketReceipt, 'date_end':new Date() }}, function (err){

                if(err)
                {
                    return res.send(404);//El ticket no se ha finalizado
                }

                res.send(ticketReceipt);
                
            });
        }

        
    }
    else
    {
        res.send(401);
    }

};

exports.saveTicket = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var data = req.body,
            moment = require('moment')
            ,ticketReceipt = '\r\n             ZAPATERIA KALZATE\r\n\r\nCC. La Trocha, Local 31. Tel. 951-315-150\r\n    Ctra Cartama, Coin, Malaga, 29100.\r\n\r\n'
            ,total = parseFloat(data['overview']['total']).toFixed(2)
            ,datetime = moment().format('DD/MM/YY HH:mm')
            ;

        ticketReceipt += ' Ticket: '+data['overview']['code']+'  Fecha: '+datetime+'\r\n\r\n Atendid@ por: '+req.user.username+'\r\n\r\n------------------------------------------\r\n Articulo              Ud.  PVP  Subtotal\r\n------------------------------------------\r\n';

        for(var i=0;i<data['products'].length;i++)
        {
            var desc;

            if(data['products'][i]['type'] == 's')
            {
                //Si se pasa de 25 lo suyo seria hacer una abreviacion
                //desc = (data['products'][i]['description'] > 25) ? data['products'][i]['abbr']:data['products'][i]['description'];
                desc = data['products'][i]['description'];
            }
            else
            {
                desc = data['products'][i]['reference']+data['products'][i]['description'];
            }

            desc = (desc.length > 21) ? desc.substr(0,17)+'... ':desc+Array(22 - desc.length).join(' ');

            ticketReceipt += ' '+desc+' '+data['products'][i]['quantity']+'x  '+parseFloat(data['products'][i]['price']).toFixed(2)+'E  '+parseFloat(data['products'][i]['subtotal']).toFixed(2)+'E\r\n';
        }

        ticketReceipt += '------------------------------------------\r\n                          TOTAL:   '+total+'E\r\n';

        if(data['overview']['total_discount'])
        {
            ticketReceipt += ' CON DESCUENTO DEL '+( parseInt(data['overview']['discount']) <= 9 ? ' '+data['overview']['discount']:data['overview']['discount'] )+'%,   TOTAL:   '+data['overview']['total_discount']+'E\r\n';
        }

        ticketReceipt +='                          (IVA incluido)\r\n\r\n';

        data['overview']['valid_till'] = moment().lang('es').add('d',7).format('dd D, MMM YYYY').toUpperCase();

        ticketReceipt += ' RESERVA VALIDA HASTA EL '+data['overview']['valid_till']+'\r\n';
        ticketReceipt += '\r\n       *** GRACIAS POR SU VISITA ***\r\n\r\n';
        ticketReceipt += '-   -   -   -   -   -   -   -   -   -   -\r\n\r\n\r\n';

        //data['overview']['date'] = new Date();

        //Obtenemos todos los productos, generamos el ticket impresion y actualizamos el ticket
        ticketsDB.update({'_id': data['_id'], 'status':'EXPIRING'}, { '$set': { 'products': data['products'], 'overview':data['overview'], 'status':'RESERVADO', 'print':ticketReceipt, 'date_end':new Date() }}, function (err){

            if(err)
            {
                return res.send(404);//El ticket no se ha finalizado
            }

            res.send(ticketReceipt);
        });
    }
    else
    {
        res.send(401);
    }

};


exports.GetFieldsForTIckets = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        //We are going to return an array of al necessary fields for tickets panel
        var numQueries = 4;
        var fields = {};


        shoesDB
        .distinct('reference')
        .exec(function (err, field) {       
            
            if(err)
            {
                return res.send(404);
            }

            fields.references = field;

            numQueries--;

            if(numQueries == 0)
            {
                res.send(fields);
            }
            
        });

        shoesDB
        .distinct('brand')
        .exec(function (err, field) {       
            
            if(err)
            {
                return res.send(404);
            }

            fields.brands = field;

            numQueries--;

            if(numQueries == 0)
            {
                res.send(fields);
            }
            
        });

        ticketsDB
        .distinct('code',{$or:[{status:'VENDIDO'}, {status:'RESERVADO'}]})
        .exec(function (err, field) {       
            
            if(err)
            {
                return res.send(404);
            }

            fields.codes = field;

            numQueries--;

            if(numQueries == 0)
            {
                res.send(fields);
            }
            
        });

        userDB
        .distinct('username')
        .exec(function (err, field) {       
            
            if(err)
            {
                return res.send(404);
            }

            fields.employees = field;

            numQueries--;

            if(numQueries == 0)
            {
                res.send(fields);
            }
            
        });
    }
    else
    {
        res.send(401);
    }
};

exports.GetTickets = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var data = req.body,
            search = {},
            date;

        if(data['search']['date'])
        {
            var moment = require('moment'),
                date = data['search']['date'].split('/'),    
                date_start = new Date(parseInt(date[2]), parseInt(date[1])-1, parseInt(date[0]),0,0,0),
                date_tomorrow = moment().add('d',1).format('DD/MM/YYYY').split('/'),
                date_end = new Date(parseInt(date_tomorrow[2]), parseInt(date_tomorrow[1])-1, parseInt(date_tomorrow[0]),0,0,0);

            search['date_end'] = {"$gte":date_start, "$lt": date_end};
            delete data['search']['date'];
        }

        if(!data['search']['status'])
        {
            search['$or'] = [{status:'VENDIDO'}, {status:'RESERVADO'}];
        }

        if(data['search']['code'])
        {
            search = {code:data['search']['code']};
        }

        search['visible'] = true;

        if(data['search']['employee'])
        {
            return userDB.findOne({'username': data['search']['employee']}, {'_id':1}, function(err, user){

                if(err || !user)
                {
                    return res.send(404);
                }

                data['search']['employee_id'] = user._id;
                delete data['search']['employee'];

                ticketsDB
                .find(search, {code:1, employee:1, print:1, status:1, date_end:1}, {limit:data['limit'], skip:data['offset']})
                .sort(data['order'])
                .execFind(function (err, tickets){            
                    
                    if (err) 
                    {
                        return res.send(404);
                    }

                    ticketsDB.count(search, function (err, count) {
                    
                        if (err) 
                        {
                            return res.send(404);
                        }

                        res.send({count: count, items: tickets});
                    }); 
                });
            });
        }
        
        ticketsDB
        .find(search, {code:1, employee:1, print:1, status:1, date_end:1}, {limit:data['limit'], skip:data['offset']})
        .sort(data['order'])
        .execFind(function (err, tickets){            
            
            if (err) 
            {
                return res.send(404);
            }

            ticketsDB.count(search, function (err, count) {
            
                if (err) 
                {
                    return res.send(404);
                }

                res.send({count: count, items: tickets});
            });
        });

    }
    else
    {
        res.send(401);
    }
};

exports.GetTicket = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        ticketsDB
        .findOne(req.body,{products:1, overview:1, date_end:1}, function(err, ticket){        
            
            if (err) 
            {
                return res.send(404);
            }

            res.send(ticket);
        });
    }
    else
    {
        res.send(401);
    }
};

exports.returnTicket = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var data = req.body
            ,moment = require('moment')
            ,ticketReceipt = '\r\n             ZAPATERIA KALZATE\r\n\r\nCC. La Trocha, Local 31. Tel. 951-315-150\r\n    Ctra Cartama, Coin, Malaga, 29100.\r\n\r\n'
            ,total = parseFloat(data['overview']['total']).toFixed(2)
            ,received = parseFloat(data['overview']['received'].replace(',','.')).toFixed(2)
            ,datetime = moment().format('DD/MM/YY HH:mm')
            ,i = 0
            ,desc;


        if(total < 0 && data['overview']['payment_method'] == 'voucher')
        {
            ticketReceipt += ' Ticket: '+data['overview']['code']+'  Fecha: '+datetime+'\r\n\r\n Atendid@ por: '+req.user.username+'\r\n\r\n------------------------------------------\r\n\r\n      ESTE TICKET VALE POR '+Math.abs(total).toFixed(2)+' EUROS\r\n\r\n------------------------------------------\r\n';
            ticketReceipt += '\r\n        VALIDO MAXIMO HASTA 6 MESES\r\n'; 
            data['overview']['voucher'] = Math.abs(total).toFixed(2);
        }
        else
        {

            ticketReceipt += ' Ticket: '+data['overview']['code']+'  Fecha: '+datetime+'\r\n\r\n Atendid@ por: '+req.user.username+'\r\n\r\n------------------------------------------\r\n Articulo              Ud.  PVP  Subtotal\r\n------------------------------------------\r\n';

            for(i=0;i<data['products']['retained'].length;i++)
            {
                desc = '(*)';

                if(data['products']['retained'][i]['type'] == 's')
                {
                    //Si se pasa de 25 lo suyo seria hacer una abreviacion
                    //desc = (data['products'][i]['description'] > 25) ? data['products'][i]['abbr']:data['products'][i]['description'];
                    desc += data['products']['retained'][i]['description'];
                }
                else
                {
                    desc += data['products']['retained'][i]['reference']+', '+data['products']['retained'][i]['description'];
                }

                desc = (desc.length > 21) ? desc.substr(0,17)+'... ':desc+Array(22 - desc.length).join(' ');

                ticketReceipt += ' '+desc+' '+data['products']['retained'][i]['quantity']+'x  '+parseFloat(data['products']['retained'][i]['price']).toFixed(2)+'E  0.00E\r\n';
            }

            for(i=0;i<data['products']['returned'].length;i++)
            {

                if(data['products']['returned'][i]['type'] == 's')
                {
                    //Si se pasa de 25 lo suyo seria hacer una abreviacion
                    //desc = (data['products'][i]['description'] > 25) ? data['products'][i]['abbr']:data['products'][i]['description'];
                    desc = data['products']['returned'][i]['description'];
                }
                else
                {
                    desc = data['products']['returned'][i]['reference']+', '+data['products']['returned'][i]['description'];
                }

                desc = (desc.length > 21) ? desc.substr(0,16)+'... ':desc+Array(21 - desc.length).join(' ');

                ticketReceipt += ' '+desc+' -'+data['products']['returned'][i]['quantity']+'x  '+parseFloat(data['products']['returned'][i]['price']).toFixed(2)+'E  -'+parseFloat(data['products']['returned'][i]['subtotal']).toFixed(2)+'E\r\n';
            }

            for(i=0;i<data['products']['new'].length;i++)
            {

                if(data['products']['new'][i]['type'] == 's')
                {
                    //Si se pasa de 25 lo suyo seria hacer una abreviacion
                    //desc = (data['products'][i]['description'] > 25) ? data['products'][i]['abbr']:data['products'][i]['description'];
                    desc = data['products']['new'][i]['description'];
                }
                else
                {
                    desc = data['products']['new'][i]['reference']+', '+data['products']['new'][i]['description'];
                }

                desc = (desc.length > 21) ? desc.substr(0,17)+'... ':desc+Array(22 - desc.length).join(' ');

                ticketReceipt += ' '+desc+' '+data['products']['new'][i]['quantity']+'x  '+parseFloat(data['products']['new'][i]['price']).toFixed(2)+'E  '+parseFloat(data['products']['new'][i]['subtotal']).toFixed(2)+'E\r\n';
            }

            ticketReceipt += '------------------------------------------\r\n                          TOTAL:   '+total+'E\r\n';

            if(data['overview']['total_discount'])
            {
                ticketReceipt += ' CON DESCUENTO DEL '+( parseInt(data['overview']['discount']) <= 9 ? ' '+data['overview']['discount']:data['overview']['discount'] )+'%,   TOTAL:   '+data['overview']['total_discount']+'E\r\n';
            }

            ticketReceipt +='                          (IVA incluido)\r\n\r\n';

            if(total != 0)
            {
                switch (data['overview']['payment_method']) 
                {
                    case 'cash':
                        ticketReceipt += ' METODO: EFECTIVO,        ENTREGA: '+received+'E\r\n                          CAMBIO:  '+data['overview']['returned']+'E\r\n';
                        break;
                    case 'credit':
                        ticketReceipt += ' METODO: T. CREDITO,      IMPORTE: '+total+'E\r\n';
                        break;
                    case 'voucher':
                        ticketReceipt += ' METODO: VALE DESCUENTO,  IMPORTE: '+total+'E\r\n';
                        break;
                    case 'phone':
                        ticketReceipt += ' METODO: TELEFONO,        IMPORTE: '+total+'E\r\n';
                        break;
                    case 'combined':
                        ticketReceipt += ' METODO: COMBINADO,     ';

                        if(data['overview']['combined_cash'])
                        {
                            ticketReceipt += '  EFECTIVO: '+data['overview']['combined_cash']+'E\r\n';

                            if(data['overview']['combined_credit'])
                            {
                                ticketReceipt += '                          T. CRED.: '+data['overview']['combined_credit']+'E\r\n';
                            }

                            if(data['overview']['combined_voucher'])
                            {
                                ticketReceipt += '                          V. DESC.: '+data['overview']['combined_voucher']+'E\r\n';
                            }
                        }
                        else if(data['overview']['combined_credit'])
                        {
                            ticketReceipt += '  T. CRED.: '+data['overview']['combined_credit']+'E\r\n';

                            if(data['overview']['combined_cash'])
                            {
                                ticketReceipt += '                          EFECTIVO: '+data['overview']['combined_cash']+'E\r\n';
                            }

                            if(data['overview']['combined_voucher'])
                            {
                                ticketReceipt += '                          V. DESC.: '+data['overview']['combined_voucher']+'E\r\n';
                            }
                        }
                        else
                        {
                            ticketReceipt += '  V. DESC.: '+data['overview']['combined_voucher']+'E\r\n';

                            if(data['overview']['combined_credit'])
                            {
                                ticketReceipt += '                          T. CRED.: '+data['overview']['combined_credit']+'E\r\n';
                            }

                            if(data['overview']['combined_cash'])
                            {
                                ticketReceipt += '                          EFECTIVO: '+data['overview']['combined_cash']+'E\r\n';
                            }
                        }

                        break;
                }
            }
            

            if(data['products']['retained'].length)
            {
                var today = moment(),
                    oldTicketDate = moment(data['products']['date']),
                    days = 30 - today.diff(oldTicketDate,'days');

                ticketReceipt += '\r\n       DEVOLUCIONES MAX. HASTA 30 DIAS\r\n';

                if(days <= 30)
                {
                    ticketReceipt += '\r\n      (*) DEVOLUCIONES MAX. '+days+' DIA'+(days > 1 ? 'S':'')+'\r\n';
                }
                else
                {
                    ticketReceipt += '\r\n     (*) NO DEVOLUCIONES ADMITIDAS \r\n';
                }
            }
            else
            {
                ticketReceipt += '\r\n     DEVOLUCIONES MAXIMO HASTA 30 DIAS\r\n';
            }
        }

        ticketReceipt += '\r\n       *** GRACIAS POR SU VISITA ***\r\n\r\n';
        ticketReceipt += '-   -   -   -   -   -   -   -   -   -   -\r\n\r\n\r\n';

        //data['overview']['date'] = new Date();

        ticketsDB.update({'code': data['overview']['update_code']}, { '$set': { 'visible': false} }, function (err){

            if(err)
            {
                return res.send(404);
            }

            var productsFinal = data['products']['productsFinal'];

            delete data['products']['productsFinal'];
            delete data['products']['date'];

            ticketsDB.update({'_id': data['_id'], 'status':'EXPIRING'}, { '$set': { 'box': data['products'], 'products': productsFinal, 'overview':data['overview'], 'status':(productsFinal.length > 0 ? 'VENDIDO' : 'DEVUELTO'), 'print':ticketReceipt, 'date_end': new Date() }}, function (err){

                if(err)
                {
                    return res.send(404);//El ticket no se ha finalizado
                }

                res.send(ticketReceipt);
                
            });
        });
    }
    else
    {
        res.send(401);
    }

};

exports.abortTicket = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var data = req.body,
            promise = {},
            ts,
            numQueries = 0;

        if(data['updated'])
        {
            return ticketsDB.update({'code': data['overview']['code']}, { '$set': { 'visible': false} }, function (err){

                if(err)
                {
                    return res.send({updated:true});
                }

                ticketsDB.update({'_id': data['_id'], 'status':'EXPIRING'}, { '$set': { 'box': {'returned':data['products'], 'new':[], 'retained':[]}, 'products': [], 'overview':data['overview'], 'status':'ANULADO', 'date_end': new Date() }}, function (err){

                    if(err)
                    {
                        return res.send({updated:true});//El ticket no se ha finalizado
                    }

                    res.send(true);
                    
                });
            });
        }

        for(var i=data['loop_index'];i<data['products'].length;i++)
        {
            //console.log('ENTRA2');
            ts = (new Date()).getTime()+Math.floor(Math.random()*1000+1);

            promise = {

                '_id':data['products'][i]['_id'],
                'quantity':-(data['products'][i]['quantity']),
                'qa':0,
                'ts': ts
            };

            numQueries++;

            ticketsDB.update({'_id': data['_id'], 'status':'EXPIRING'}, { '$push': { 'products': promise }}, function (err){

                if(err)
                {
                    return res.send({error:i});//El producto no se ha añadido
                }

                //console.log('ENTRA3');

                shoesDB.update({'_id': promise['_id'], 'quantity': {'$gte': 0}}, 
                { $inc: {quantity: (promise['qa']-promise['quantity'])}, '$set': { in_carts: { quantity:promise['quantity'], id: data['_id'], timestamp: ts}}}, function (err){

                    if(err)
                    {
                        console.log('4',err);
                        return res.send({error:i});//El producto no se ha añadido
                    }

                    numQueries--;

                    if(numQueries == 0)
                    {
                        //console.log('ENTRA4');
                        ticketsDB.update({'code': data['overview']['code']}, { '$set': { 'visible': false} }, function (err){

                            if(err)
                            {
                                return res.send({updated:true});
                            }

                            ticketsDB.update({'_id': data['_id'], 'status':'EXPIRING'}, { '$set': { 'box': {'returned':data['products'], 'new':[], 'retained':[]}, 'products': [], 'overview':data['overview'], 'status':'ANULADO', 'date_end': new Date() }}, function (err){

                                if(err)
                                {
                                    return res.send({updated:true});//El ticket no se ha finalizado
                                }

                                res.send(true);
                                
                            });
                        });
                    }
                });
            });
        }  
    }
    else
    {
        res.send(401);
    }

};

exports.GetSessionTicket = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        
        var newTicket = new ticketsDB({employee:req.user.username, employee_id:req.user._id});

        newTicket.save(function (err){

            if(err)
            {
                return res.send(404);
            }

            ticketsDB
            .findOne(req.body,{products:1, overview:1, date_end:1}, function(err, ticket){        
                
                if (err) 
                {
                    return res.send(404);
                }

                res.send({'sessTicket':newTicket,'ticket':ticket});
            });
        });
    }
    else
    {
        res.send(401);
    }
};

exports.GetBox = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var data = req.body,
            moment = require('moment'),
            date,
            date_start,
            date_end,
            search = {};

        if(data['dateFrom'] == data['dateTo'])
        {
            date = data['dateFrom'].split('/');
            date_start = new Date(parseInt(date[2]), parseInt(date[1])-1, parseInt(date[0]),0,0,0);

            date = moment().add('d',1).format('DD/MM/YYYY').split('/');
            date_end = new Date(parseInt(date[2]), parseInt(date[1])-1, parseInt(date[0]),0,0,0);
        }
        else
        {
            date = data['dateFrom'].split('/');
            date_start = new Date(parseInt(date[2]), parseInt(date[1])-1, parseInt(date[0]),0,0,0);

            date = data['dateTo'].split('/');
            date_end = new Date(parseInt(date[2]), parseInt(date[1])-1, parseInt(date[0]),0,0,0);
        
        }

        search['date_end'] = {"$gte":date_start, "$lt": date_end};
        
        //console.log(search['date_end']);

        ticketsDB
        .find(search, function (err, tickets) {            
            
            //console.log(tickets);

            if(err) 
            {
                return res.send(404);
            }

            if(!tickets.length)
            {
                return res.send({box:[],total:0})
            }

            userDB
            .find({},{username:1,_id:1}, function (err, employees) {       
                
                var i, box = [], temp_box = {}, summary;

                summary = {employee:'', ordered:0, returned_cash:0, returned_voucher:0, returned_plus_ordered:0, booked:0, cancelled:0, total_cash:0, total_credit:0, total_voucher:0, total_rcash:0, total:0, total_tickets:0};

                for(i=0;i<employees.length;i++)
                {
                    //box.push({employee:employees[i], ordered:0, returned:0, booked:0, cancelled:0, total:0});
                    temp_box[employees[i]['_id']] = {employee:employees[i]['username'], ordered:0, returned_cash:0, returned_voucher:0, returned_plus_ordered:0, booked:0, cancelled:0, total_cash:0, total_credit:0, total_voucher:0, total_rcash:0, total:0, total_tickets:0};
                }

                for(i=0;i<tickets.length;i++)
                {
                    if(tickets[i]['status'] == 'VENDIDO')
                    { 
                        //console.log(tickets[i]['overview']['total']);
                        if(tickets[i]['overview']['total'] < 0)
                        {
                            
                            if(tickets[i]['box']['new'].length)
                            {
                                temp_box[tickets[i]['employee_id']].ordered++;
                                summary.ordered++;
                            }

                            if(tickets[i]['overview']['payment_method'] == 'voucher')
                            {
                                temp_box[tickets[i]['employee_id']].returned_voucher++;
                                summary.returned_voucher++;
                            }
                            //else if(tickets[i]['overview']['payment_method'] == 'cash')
                            else
                            {
                                temp_box[tickets[i]['employee_id']].returned_cash++;
                                summary.returned_cash++;

                                temp_box[tickets[i]['employee_id']].total_rcash += tickets[i]['overview']['total'];
                                //temp_box[tickets[i]['employee_id']].total_cash += tickets[i]['overview']['total'];
                                temp_box[tickets[i]['employee_id']].total += tickets[i]['overview']['total'];
                                summary.total_rcash += tickets[i]['overview']['total'];
                                //summary.total_cash += tickets[i]['overview']['total'];
                                summary.total += tickets[i]['overview']['total'];
                            }
                        }
                        //vendido
                        else
                        {
                            
                            if(tickets[i]['box'] && tickets[i]['box']['returned'].length)
                            {
                                temp_box[tickets[i]['employee_id']].returned_plus_ordered++;
                                summary.returned_plus_ordered++;
                            }

                            temp_box[tickets[i]['employee_id']].ordered++;
                            summary.ordered++;

                            //temp_box[tickets[i]['employee_id']].total += tickets[i]['overview']['total'];
                            //summary.total += tickets[i]['overview']['total'];
                            
                            if(tickets[i]['overview']['payment_method'] == 'cash')
                            {
                                temp_box[tickets[i]['employee_id']].total_cash += tickets[i]['overview']['total'];
                                summary.total_cash += tickets[i]['overview']['total'];

                                temp_box[tickets[i]['employee_id']].total += tickets[i]['overview']['total'];
                                summary.total += tickets[i]['overview']['total'];
                            }
                            else if(tickets[i]['overview']['payment_method'] == 'credit')
                            {
                                temp_box[tickets[i]['employee_id']].total_credit += tickets[i]['overview']['total'];
                                summary.total_credit += tickets[i]['overview']['total'];

                                temp_box[tickets[i]['employee_id']].total += tickets[i]['overview']['total'];
                                summary.total += tickets[i]['overview']['total'];
                            }
                            else if(tickets[i]['overview']['payment_method'] == 'voucher')
                            {
                                temp_box[tickets[i]['employee_id']].total_voucher += tickets[i]['overview']['total'];
                                summary.total_voucher += tickets[i]['overview']['total'];
                            }
                            else
                            {
                                temp_box[tickets[i]['employee_id']].total_credit += (tickets[i]['overview']['combined_credit'] || 0);
                                summary.total_credit += (tickets[i]['overview']['combined_credit'] || 0);

                                temp_box[tickets[i]['employee_id']].total_cash += (tickets[i]['overview']['combined_cash'] || 0);
                                summary.total_cash += (tickets[i]['overview']['combined_cash'] || 0);

                                temp_box[tickets[i]['employee_id']].total_voucher += (tickets[i]['overview']['combined_voucher'] || 0);
                                summary.total_voucher += (tickets[i]['overview']['combined_voucher'] || 0);

                                temp_box[tickets[i]['employee_id']].total += (tickets[i]['overview']['combined_credit'] || 0) + (tickets[i]['overview']['combined_cash'] || 0);
                                summary.total += (tickets[i]['overview']['combined_credit'] || 0) + (tickets[i]['overview']['combined_cash'] || 0);
                            }

                        }
                        /*
                        if(tickets[i]['box'])
                        {
                            //if(tickets[i]['box']['returned'].length)
                            if(tickets[i]['overview']['total'] < 0)
                            {
                                
                                if(tickets[i]['box']['new'].length)
                                {
                                    temp_box[tickets[i]['employee_id']].ordered++;
                                    summary.ordered++;
                                }

                                if(tickets[i]['overview']['payment_method'] == 'voucher')
                                {
                                    temp_box[tickets[i]['employee_id']].returned_vocuher++;
                                    summary.returned_vocuher++;
                                }
                                //else if(tickets[i]['overview']['payment_method'] == 'cash')
                                else
                                {
                                    temp_box[tickets[i]['employee_id']].returned_cash++;
                                    summary.returned_cash++;

                                    temp_box[tickets[i]['employee_id']].total_cash += tickets[i]['overview']['total'];
                                    temp_box[tickets[i]['employee_id']].total += tickets[i]['overview']['total'];
                                    summary.total_cash += tickets[i]['overview']['total'];
                                    summary.total += tickets[i]['overview']['total'];
                                }
                            }
                            //vendido
                            else
                            {
                                
                                if(tickets[i]['box']['returned'].length)
                                {
                                    temp_box[tickets[i]['employee_id']].returned_plus_ordered++;
                                    summary.returned_plus_ordered++;
                                }

                                temp_box[tickets[i]['employee_id']].ordered++;
                                summary.ordered++;

                                temp_box[tickets[i]['employee_id']].total += tickets[i]['overview']['total'];
                                summary.total += tickets[i]['overview']['total'];
                                
                                if(tickets[i]['overview']['payment_method'] == 'cash')
                                {
                                    temp_box[tickets[i]['employee_id']].total_cash += tickets[i]['overview']['total'];
                                    summary.total_cash += tickets[i]['overview']['total'];
                                }
                                else if(tickets[i]['overview']['payment_method'] == 'credit')
                                {
                                    temp_box[tickets[i]['employee_id']].total_credit += tickets[i]['overview']['total'];
                                    summary.total_credit += tickets[i]['overview']['total'];
                                }
                            }
                        }
                        //vendido
                        else
                        {
                            temp_box[tickets[i]['employee_id']].ordered++;
                            summary.ordered++;

                            temp_box[tickets[i]['employee_id']].total += tickets[i]['overview']['total'];
                            summary.total += tickets[i]['overview']['total'];
                            
                            if(tickets[i]['overview']['payment_method'] == 'cash')
                            {
                                temp_box[tickets[i]['employee_id']].total_cash += tickets[i]['overview']['total'];
                                summary.total_cash += tickets[i]['overview']['total'];
                            }
                            else if(tickets[i]['overview']['payment_method'] == 'credit')
                            {
                                temp_box[tickets[i]['employee_id']].total_credit += tickets[i]['overview']['total'];
                                summary.total_credit += tickets[i]['overview']['total'];
                            }
                        } 
                        */               
                    }
                    else if(tickets[i]['status'] == 'DEVUELTO')
                    {
                        if(tickets[i]['overview']['payment_method'] == 'voucher')
                        {
                            temp_box[tickets[i]['employee_id']].returned_voucher++;
                            summary.returned_voucher++;
                        }
                        //else if(tickets[i]['overview']['payment_method'] == 'cash')
                        else
                        {
                            temp_box[tickets[i]['employee_id']].returned_cash++;
                            summary.returned_cash++;

                            temp_box[tickets[i]['employee_id']].total_rcash += tickets[i]['overview']['total'];
                            //temp_box[tickets[i]['employee_id']].total_cash += tickets[i]['overview']['total'];
                            temp_box[tickets[i]['employee_id']].total += tickets[i]['overview']['total'];
                            summary.total_rcash += tickets[i]['overview']['total'];
                            //summary.total_cash += tickets[i]['overview']['total'];
                            summary.total += tickets[i]['overview']['total'];
                        }
                    }
                    else if(tickets[i]['status'] == 'RESERVADO')
                    {
                        temp_box[tickets[i]['employee_id']].booked++;
                        summary.booked++;
                    }
                    else if(tickets[i]['status'] == 'ANULADO')
                    {
                        temp_box[tickets[i]['employee_id']].cancelled++;
                        summary.cancelled++;
                    }

                    /*if(tickets[i]['visible'])
                    {
                        temp_box[tickets[i]['employee_id']].total_tickets++;
                        summary.total_tickets++;
                    }*/
                }

                for(var employee in temp_box)
                {
                    box.push(temp_box[employee]);
                }

                box.push(summary);

                //PRINTING PDF AND

                //res.send({box:box,total:summary.total}); 
                res.send({box:box,total:summary.total_cash+summary.total_rcash}); 
                
            });

        });
    }
    else
    {
        res.send(401);
    }
};

exports.Backup = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var spawn = require('child_process').spawn,
            args = ['--db', 'kalzate'],
            mongodump = spawn('/usr/bin/mongodump', args)
            ;
        
        /*
        mongodump.stdout.on('data', function (data) {
          
            console.log('stdout: ' + data);

            //res.attachment('backup.data');
            //res.setHeader('Content-Type', 'text/pdf');
            //res.end(data,'binary');
        });
        */

        mongodump.stderr.on('data', function (data) 
        {
            
            res.send(404);

        });

        
        mongodump.on('close', function (code) 
        {
            var archiver = require('archiver'),
                moment = require('moment'),
                filename = 'kalzate_'+(moment().format('DD_MM_YYYY'))+'.zip',
                path = __dirname+'/../../../client/app/db_backup/'+filename,
                output = fs.createWriteStream(path),
                archive = archiver('zip');

            output.on('close', function() {
            
                //console.log('archiver has been finalized and the output file descriptor has closed.');
                //res.attachment('backup.zip');
                //res.setHeader('Content-Type', 'application/zip');
                res.sendfile(filename, {'root': __dirname+'/../../../client/app/db_backup/'});
            });

            archive.on('error', function(err) {
            
                res.send(404);
            });

            archive.pipe(output);

            archive
            .append(fs.createReadStream(__dirname + '/../../dump/kalzate/shoes.bson'), { name: 'shoes.bson' })
            .append(fs.createReadStream(__dirname + '/../../dump/kalzate/shoes.metadata.json'), { name: 'shoes.metadata.json' })
            .append(fs.createReadStream(__dirname + '/../../dump/kalzate/tickets.bson'), { name: 'tickets.bson' })
            .append(fs.createReadStream(__dirname + '/../../dump/kalzate/tickets.metadata.json'), { name: 'tickets.metadata.json' })
            .append(fs.createReadStream(__dirname + '/../../dump/kalzate/users.bson'), { name: 'users.bson' })
            .append(fs.createReadStream(__dirname + '/../../dump/kalzate/users.metadata.json'), { name: 'users.metadata.json' })
            ;
            
            archive.finalize(function (err, bytes) {
                
                if (err) 
                {
                    res.send(404);
                }
            });
            
        });
        
    }
    else
    {
        res.send(401);
    }
};

exports.ValidateVoucher = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        ticketsDB
        .findOne(req.body, {overview:1, date_end:1}, function (err, ticket){        
            
            if (err || !ticket || !ticket.overview['voucher']) 
            {
                return res.send(404);
            }

            //check if it is out of date
            var moment = require('moment')
                ,today = moment()
                ,oldTicketDate = moment(ticket.date_end)
                ;

            //Exactly 6 months. 6 months and one day is not accepted
            if(today.diff(oldTicketDate,'months', true) > 6)
            {
                return res.send(404);
            }

            res.send({total:Math.abs(ticket.overview['voucher'])});
        });
    }
    else
    {
        res.send(401);
    }
};


exports.UtilsShutdown = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        var sys = require('sys'),
            exec = require('child_process').exec
            ;
        
        exec('shutdown -h now', function (error, stdout, stderr) { sys.puts(stdout); res.send(true); });
    }
    else
    {
        res.send(401);
    }
};
