/**************************************************************************

Module dependencies.
 
**************************************************************************/

var shoesDB     = require('../db/shoes');
var fs          = require('fs');

/**************************************************************************

Constants
 
**************************************************************************/

var DEBUG = true;
var DEFAULT_SHOES_LIMIT = 10;
var DEFAULT_SHOES_OFFSET = 0;
var DEFAULT_SHOES_ORDER = {'id':1};

/**************************************************************************

Store functions
 
**************************************************************************/

var getShoes = function (what, limit, offset, order, cb)
{
    //Arguments
    var what    = what || {};
    var limit   = limit || DEFAULT_SHOES_LIMIT;
    var offset  = offset || DEFAULT_SHOES_OFFSET;
    var order   = order || DEFAULT_SHOES_ORDER;
    var cb      = cb || this.arguments[this.arguments.length-1];

    var fields = {

        reference:1, 
        brand:1, 
        size:1, 
        category:1, 
        color:1, 
        quantity:1, 
        price:1, 
        images:1, 
        has_qr:1, 
        barcode:1
    };

    shoesDB
    .find(what, fields, {limit: limit, skip: offset})
    .sort(order)
    .execFind(function (err, shoes) {            
        
        if (err) 
        {
            return cb(err);
        }

        shoesDB.count(what, function (err, count) {
        
            if (err) 
            {
                if (DEBUG) console.log('ERROR: getShoes', err);
                return cb(true);
            }

            cb(false, {count: count, items: shoes});
        });
    });
};

var getShoeById = function (id, cb)
{
    //Arguments
    var id      = id || '';
    var cb      = cb || this.arguments[this.arguments.length-1];

    shoesDB
    .findById(id, {qr:0, 'last-modified':0, history:0, sold:0}, function (err, shoe) {            
        
        if (!shoe || err) 
        {
            return cb(true);
        }

        cb(false, shoe);
    });
};

var updateShoeById = function (id, change, cb)
{
    //Arguments
    var id      = id || '';
    var change  = change || {};
    var cb      = cb || this.arguments[this.arguments.length-1];

    shoesDB
    .findByIdAndUpdate(id, {$set: change}, function (err, shoe) {
        
            if (!shoe || err) 
            {
                 return cb(true);
            }
            
            cb(false, true);
    });
};

exports.GetShoes = function (req, res, next)
{
    if(req.user && req.user.role == 'employee')
    {
        
        //TODO: Filter it!
        var data    = req.body;
        var what    = !data['search'] ? {} : data['search'];
        var limit   = data['limit'];
        var offset  = data['offset'];
        var order   = data['order']

        getShoes(what, limit, offset, order, function (err, response) {

            if (err) 
            {
                return res.send(401);
            }

            res.send(response);
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

        getShoeById(id, function (err, response) {

            if (err) 
            {
                return res.send(401);
            }

            res.send(response);
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

        updateShoeById(id, req.body, function (err, shoe) {
        
            if (err) 
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
