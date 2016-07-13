var mongoose = require('mongoose')
    ,applications
    ,appModel;


/***************************************
*
*              SCHEMAS
*
*
****************************************/
applications = mongoose.Schema({

    'title': {type:String, required:true, lowercase: true, trim: true, unique:true},
    'author': {type:String, required:true},
    'description':[{lng:String, text:String}],
    'type': {type:String, required:true},
    'version':{type:String, required:true},
    'actived': {type:Boolean, default: true},
    'location':{type:String, required:true},
    'require': {type:String, default: 'setup'} ,
    'single': {type:Boolean, default: false},
    'valoration': {'voters':[String],'votes-up':{type:Number,default: 0},'votes-down':{type:Number,default: 0}},
    'lng':[String],
    'keywords':[String],
    'setup': [String],
    'categories': [String],
    'comments': [{ body: String, date: Date, author: String }],

    'api-scope': [{ api: String, scope: String }],//mongoose.Schema.Types.Mixed,
    //api-scope: {'core':2,'desktop':0}
    'dependencies': [{ dep: String, version: String }],//mongoose.Schema.Types.Mixed,
    //dependencies: {'desktop':'1.1.2','terminal':'0.1.*'}
    
    'scripts': [String],
    
    'last-modified': { type: Date, default: Date.now }
});


appModel = mongoose.model('applications', applications);

appModel.schema.path('title').validate(function(value){
  
  return /^[a-z]{1}[a-z0-9\_]+$/.test(value) && value.length<16;
  
}, 'Invalid title');

module.exports = appModel;
