var mongoose = require('mongoose')
    ,items
    ,itemModel
    ;
/***************************************
*
*              SCHEMAS
*
*
****************************************/
items = mongoose.Schema({

    'reference'     : {type:String, required:true, uppercase: true, trim: true, index: true},
    'brand'         : {type:String, uppercase: true, trim: true, index: true},
    'price'         : {type:String, required:true, trim: true},
    'quantity'      : {type:Number, required:true, trim: true, default: 1},
    'size'          : {type:Number, trim: true, index: true},
    'color'         : {type:String, required:true, uppercase: true, trim: true, index: true},
    'category'      : {type:String, uppercase: true, trim: true},
    'maker'         : {type:String},
    'provider'      : {type:String},
    'images'        : [],
    'location'      : {type:String},
    'sold'          : {type:Number, default: 0},
    'qr'            : {type:String},
    'barcode'       : {type:String, unique:true, index:true, default: function(){ return generate(); }},
    //'barcode_type'  : {type:String},
    'has_qr'        : {type:Boolean, default: false},
    'description'   : {type:String},
    'history'       : [{ action: String, date: Date, employee: String }],

    'valoration'    : {'voters':[String],'votes-up':{type:Number,default: 0},'votes-down':{type:Number,default: 0}},
    'actived'       : {type:Boolean, default: true},
    'keywords'      : [String],
    'comments'      : [{ text: String, date: Date, employee: String }],
    'last-modified' : { type: Date, default: Date.now }
});


items.index({ reference: 1, color:1}, { unique: true });
items.index({ barcode: 1});
//items.index({}, { unique: true });

itemModel = mongoose.model('complements', items);

//itemModel.pre( "init", function (next) { console.log("pre init") });
/*
itemModel.schema.path('title').validate(function(value){
  
  return /^[a-z]{1}[a-z0-9\_]+$/.test(value) && value.length<16;
  
}, 'Invalid title');
*/
module.exports = itemModel;
