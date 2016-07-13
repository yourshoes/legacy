var mongoose = require('mongoose')
    ,users
    ,usersModel;


/***************************************
*
*              SCHEMAS
*
*
****************************************/
users = mongoose.Schema({

    'username': {type:String, trim:true, required:true, unique:true, trim: true},
    'email': {type:String, required:true, unique:true, lowercase: true, trim: true},
    'password': {type:String, trim: true, required:true},
    'role': {type:String, trim: true, required:true}
});


usersModel = mongoose.model('users', users);

usersModel.schema.path('email').validate(function(value){
  
  return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
  
}, 'Invalid email');

usersModel.schema.path('password').validate(function(value){
  
  return value.length >= 8;
  
}, 'Invalid password');

module.exports = usersModel;
