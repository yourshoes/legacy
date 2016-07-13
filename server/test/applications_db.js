// var mongoose = require('mongoose')
//     ,should = require('should')//require('assert')
//     ,appDB = require('../db/applications')
//     ;


// describe('(Applications Mongo Collection)', function(){
  
//     before(function(done){
        
//         mongoose.connect('mongodb://localhost/ssoss');

//         appDB.remove(function(err){
            
//             if(err) return done(err);
            
//             done();
//         });

//     });
  
//     it('field required', function(done){

//         var app;
        
//         //Title required
//         app = new appDB({
        
//             'title': '',
//             'author': 'author',
//             'type': 'type',
//             'version':'version',
//             'actived': true,
//             'location':'location'
            
//             /*'valoration': {'voters':[String],'votes-up':Number,'votes-down':Number},
//             'keywords':['keywords'],
//             'setup': ['setup'],
//             'categories': ['categories'],
//             'comments': [{ body: 'body', date: Date.now, author: 'author' }],
//             'api-scope': {'core':2,'desktop':0},
//             'dependencies':{'desktop':'1.1.2','terminal':'0.1.*'},
//             'scripts': ['scripts'],
//             'last-modified': Date.now*/
//         });
        
//         app.save(function(err){
        
//             err.should.be.a('object').and.have.property('message', 'Validation failed');

//             return done();
            
//         });

//     });
    
//     it('field unique', function(done){

//         var app, app2;
        
//         //Title unique
//         app = new appDB({
        
//             'title': ' LoGiN   ',
//             'author': 'author',
//             'type': 'type',
//             'version':'version',
//             'actived': true,
//             'location':'location'
//         });
        
//         app.save(function(err){
        
//             should.not.exist(err);
            
//             app2 = new appDB({
            
//                 'title': 'login',
//                 'author': 'author',
//                 'type': 'type',
//                 'version':'version',
//                 'actived': true,
//                 'location':'location'
//             });
            
//             app2.save(function(err){

//                 err.should.be.a('object').and.have.property('name', 'MongoError');

//                 return done();
                
//             });
            
//         });

//     });
    
//     it('custom title validation numbers', function(done){

//         var app;
        
//         //Title required
//         app = new appDB({
        
//             'title': '9login',
//             'author': 'author',
//             'type': 'type',
//             'version':'version',
//             'actived': true,
//             'location':'location'
//         });
        
//         app.save(function(err){
        
//             err.should.be.a('object').and.have.property('message', 'Validation failed');

//             return done();
            
//         });

//     });
    
//     it('custom title validation white spaces', function(done){

//         var app;
        
//         //Title required
//         app = new appDB({
        
//             'title': 'login login',
//             'author': 'author',
//             'type': 'type',
//             'version':'version',
//             'actived': true,
//             'location':'location'
//         });
        
//         app.save(function(err){
        
//             err.should.be.a('object').and.have.property('message', 'Validation failed');

//             return done();
            
//         });

//     });

//     it('reading an application', function(done){

//         var app;
        
//         //Title required
//         app = new appDB({
        
//             'title': 'My_login',
//             'author': 'author',
//             'type': 'type',
//             'version':'version',
//             'actived': true,
//             'location':'location'
            
//             /*'valoration': {'voters':[String],'votes-up':Number,'votes-down':Number},
//             'keywords':['keywords'],
//             'setup': ['setup'],
//             'categories': ['categories'],
//             'comments': [{ body: 'body', date: Date.now, author: 'author' }],
//             'api-scope': {'core':2,'desktop':0},
//             'dependencies':{'desktop':'1.1.2','terminal':'0.1.*'},
//             'scripts': ['scripts'],
//             'last-modified': Date.now*/
//         });
        
//         app.save(function(err){
        
//             should.not.exist(err);

//             appDB.find({title:'my_login'}, function(err,app){
            
//                 //console.log(app);
                
//                 if(err) return done(err);
                
//                 done();
                
//             });

            
//         });

//     });
    
//     after(function(){
    
//         appDB.remove(function(err){

//         });
//     });
  
// });


