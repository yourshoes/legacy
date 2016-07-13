var mongoose = require('mongoose')
    ,cptStore
    ,usersModel;


cptStore = [

    {lng:'es', q:'¿Cuantos dias tiene la semana?',s:'7'}

];
/***************************************
*
*              SCHEMAS
*
*
****************************************/
users = mongoose.Schema({

    'alias': String,
    'username': String,
    'passwd': String,
    'actived': Boolean,
    'groups': [String],
    'apps':[String],
    'env': [{'name':String, 'value':String}],
    
    'on-login':{
        
        ip:String,
        ua:String,
        device:String,
        os:String, 
        date:Date,
        times:{type:Number, default:0},
        secureToken:String
    },
    
    'on-creation': {
    
        ip:String,
        ua:String,
        device:String,
        os:String,
        date:{type:Date,default:Date.now}
    }
    
});


usersModel = mongoose.model('users', users);


module.exports = usersModel;
