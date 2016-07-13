 var PDFDoc = require('pdfkit')
    ,doc = new PDFDoc({size:'A4', info:{title:'Kalzate Barcodes', author: 'Zurisadai'}})
    ,mongoose = require('mongoose')
    ,shoesDB = require('./lib/db/shoes')
    ;

mongoose.connect('mongodb://localhost/kalzate');
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

shoesDB
.find({},{reference:1,brand:1,color:1,size:1,barcode:1, quantity:1}, function (err, shoes)
{            
    
    if (err) 
    {
        return console.log('error');
    }

    doc.fontSize(7);

    //doc.addPage();
    var path = __dirname + '/../client/app/barcodes/'
        ,fs = require('fs')
        ,barc = new (require('barc'))({fontsize:'16px'})
        ,imgPath
        ;

    var x = 9;
    var y = 17;
    var text = [];
    var j;
    var t = 0;
    var in_c = 0;
    var total_length = shoes.length;
    var long_text;

    for(var i=0;i<shoes.length;i++)
    {
        //doc.text(shoes[i]['reference']+' | '+shoes[i]['brand']+' | '+shoes[i]['color']+' | '+shoes[i]['size']);

        imgPath = path+shoes[i]['barcode']+'.png';
        
        if(!fs.existsSync(imgPath))
        {
            console.log('image does not exist: creating it');

            try
            {
                
                fs.writeFileSync(imgPath, barc.code128(shoes[i]['barcode'], 210, 110));
            }
            catch(e)
            {
                console.log('creating err');
                continue;
            }
        }
        else
        {
            console.log('image does exist: Not creating it');
        }

        console.log('barcode: '+shoes[i]['barcode']+', cantidad: '+shoes[i]['quantity']);

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

        console.log('j:'+j);

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

         //doc.moveDown();
    }

    console.log('finished!');
    return doc.write('output.pdf');

});

