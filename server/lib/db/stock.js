var mongoose = require('mongoose')
    ,items
    ,itemModel;


/***************************************
*
*              SCHEMAS
*
*
****************************************/
items = mongoose.Schema({

    'reference'     : {type:String, required:true, lowercase: true, trim: true, unique:true},
    'brand'         : {type:String, required:true},
    'price'         : {type:String, required:true},
    'quantity'      : {type:Number, required:true, default: 1},
    'size'          : {type:Number},
    'colour'        : {type:String},
    'category'      : {type:Number, required:true, default:0},
    'season'        : {type:String, enum: ['winter', 'summer']},
    'maker'         : {type:String},
    'provider'      : {type:String},
    'images'        : [],
    'location'      : {type:String},
    'sold'          : {type:Number, default: 0},
    'qr'            : {type:String},
    'description'   : {type:String},
    'history'       : [{ action: String, date: Date, employee: String }],

    'valoration'    : {'voters':[String],'votes-up':{type:Number,default: 0},'votes-down':{type:Number,default: 0}},
    'actived'       : {type:Boolean, default: true},
    'keywords'      : [String],
    'comments'      : [{ text: String, date: Date, employee: String }],
    'last-modified' : { type: Date, default: Date.now }
});


itemModel = mongoose.model('items', items);
/*
itemModel.schema.path('title').validate(function(value){
  
  return /^[a-z]{1}[a-z0-9\_]+$/.test(value) && value.length<16;
  
}, 'Invalid title');
*/
module.exports = itemModel;
