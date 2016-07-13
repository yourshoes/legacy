/**************************************************************************

Test dependencies.
 
**************************************************************************/
var http    = require('http');
var should  = require('should');//require('assert')
var request = require('supertest');
var server  = http.createServer(require('../lib/server'));

/**************************************************************************

Constants
 
**************************************************************************/

var NEW_TICKET_URL = '/tickets';
/**************************************************************************

Test Suite 
 
**************************************************************************/
describe('NewTicket function of Sales API which is running every time the user enters the sales panel in the application (kalzate.com/sales)', function(){
  
    before(function(){
        server.listen(3000);
    });
  
    it('There are no tickets', function(done){

        request(server)
        .get(NEW_TICKET_URL)
        .expect(200)
        .end(function(err, res){
            
            if(err) return done(err);
            
            res.should.be.a('object');
            res.should.have.property('headers');
            res['headers'].should.have.property('location','/oauth/login');

            done();
        });
          
        /*http.get('http://localhost:3000', function (res) {
          assert.equal(404, res.statusCode);
          done();
        });*/
    });
    
    it('There is one open ticket with no items', function(done){

        request(server)
        .get('/oauth/login')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .end(function(err,res){
            
            if(err) return done(err);
            done();
        });

    });
    
    it('There is one open ticket with items', function(done){

        //Create ticket

        //Add products

        //Create ticket

        //check products were restored
        request(server)
        .post('/oauth/login')
        .expect(302)
        .end(function(err,res){
            
            if(err) return done(err);
            
            res.should.be.a('object');
            res.should.have.property('headers');
            res['headers'].should.have.property('location','/oauth/login');

            done();
        });

    });
    
    it('there are two open tickets and with no items', function(done){


    });

    it('open a ticket, add products, open a second ticket', function(done){


    });

    it('Isolated Login Connection(POST) right user', function(done){

        request(server)
        .post('/oauth/login')
        .send({'username': 'bob@bob.com', 'password':'secret'})
        .expect(302)
        .end(function(err,res){
            
            if(err) return done(err);
            
            res.should.be.a('object');
            res.should.have.property('headers');
            res['headers'].should.have.property('location','/oauth/authorize');

            done();
        });

    });
    
    it('Isolated Dialog Endpoint', function(done){

        request(server)
        .post('/oauth/dialog')
        .expect(302)
        .end(function(err,res){
        
            if(err) return done(err);
            res.should.be.a('object');
            res.should.have.property('headers');
            res['headers'].should.have.property('location','/oauth/login');

            done();
        });

    });
    
    it('Isolated Token Endpoint no client', function(done){

        
        request(server)
        .post('/oauth/token')
        .expect(401,done)//Not Authorized
        ;

    });


    it('Isolated Token Endpoint client HTTP Basic Strategy OK', function(done){

        //base 64 ();
        var username = 'abc123'
            ,password = 'ssh-secret'
            ,base64 = new Buffer(username+':'+password).toString('base64')
            ;
            
        request(server)
        .post('/oauth/token')
        .set('Authorization','Basic '+base64)
        .expect(400,done)
        ;
        //400 -> BadRequest due to we need to provide other parameters in the URL as grant_type and authorization_code, we are just testing the client authorization

    });
    
    it('Isolated Token Endpoint client HTTP Basic Strategy KO', function(done){

        //base 64 ();
        var username = 'nothing'
            ,password = 'nothing'
            ,base64 = new Buffer(username+':'+password).toString('base64')
            ;
            
        request(server)
        .post('/oauth/token')
        .set('Authorization','Basic '+base64)
        .expect(401,done)
        ;

    });
    
    it('Isolated Token Endpoint client ClientPassword Strategy OK', function(done){

        var username = 'abc123'
            ,password = 'ssh-secret'
            ;
            
        request(server)
        .post('/oauth/token')
        .send({'client_id':username,'client_secret':password})
        .expect(400,done)
        ;

    });
    
    it('Isolated Token Endpoint client ClientPassword Strategy KO', function(done){

        var username = 'nothing'
            ,password = 'nothing'
            ;
            
        request(server)
        .post('/oauth/token')
        .send({'client_id':username,'client_secret':password})
        .expect(401,done)
        ;

    });
    
    /*it('should say "Hello, world!"', function(done){

    http.get('http://localhost:3000', function (res) {
      var data = '';

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        assert.equal('Hello, world!\n', data);
        done();
      });
    });

    });*/
    
    it('OAuth Server Complete Process', function(done){

        var url = '/oauth/authorize?client_id=abc123&response_type=code&redirect_uri=http%3A%2F%2Fwww.example.com'
        //Authorization endpoint
        request(server)
        .get(url)
        .expect(302)
        .end(function(err,res){

            if(err) return done(err);
            
            var cookie = res.headers['set-cookie'];
            
            res.should.be.a('object');
            res.should.have.property('headers');
            res['headers'].should.have.property('location','/oauth/login');
        
            //Login endpoint
            request(server)
            .post('/oauth/login')
            .set('Cookie',cookie)
            .send({'username': 'bob@bob.com', 'password':'secret'})
            .expect(302)
            .end(function(err,res){
                
                if(err) return done(err);
                
                res.should.be.a('object');
                res.should.have.property('headers');
                res['headers'].should.have.property('location',url);

                //Dialog endpoint
                request(server)
                .get(url)
                .set('Cookie',cookie)
                .expect(200)
                .end(function(err,res){

                    if(err) return done(err);
                    
                    res.should.be.a('object');
                    res.should.have.property('text');
                    res.text.should.include('Hi Bob Smith!, Samplr');
                    
                    var transaction_id = 
                    res['text']
                    .match(/value=\".{8}\"/ig)
                    .shift()
                    .replace(/value|\=|\"/g,"")
                    ;

                    //Dialog endpoint
                    request(server)
                    .post('/oauth/dialog')
                    .set('Cookie',cookie)
                    //.send({'cancel': 'No', 'transaction_id':''})
                    .send({'transaction_id':transaction_id})
                    .expect(302)
                    .end(function(err,res){
                        
                        if(err) return done(err);

                        res.should.be.a('object');
                        res.should.have.property('headers');
                        res['headers'].should.have.property('location');
                        res['headers']['location'].should.match(/code=.+$/g);
                        
                        var username = 'abc123'
                            ,password = 'ssh-secret'
                            ,code = res['headers']['location'].match(/code=.+$/g).shift().replace("code=","")
                            ,params = {'client_id':username,'client_secret':password, 'code' : decodeURIComponent(code), 'grant_type':'authorization_code', 'redirect_uri':'http://www.example.com'}
                            ;

                        //console.log(decodeURIComponent(code));

                        //Token endpoint
                        request(server)
                        .post('/oauth/token')
                        .send(params)
                        .expect(200)
                        .end(function(err,res){

                            if(err) return done(err);
                            
                            res.headers.should.be.a('object');
                            res.headers.should.have.property('content-type','application/json');
                            res.should.be.a('object');
                            res.should.have.property('text');
                            res.text.should.include('access_token');
                            res.text.should.include('token_type');
                            
                            done();
                        });
                     });
                });
            });
        });

    });

    after(function(){
        server.close();
    });
  
});


