var mongoose = require('mongoose')
    ,items
    ,itemModel
    ;

var generate = function() {

    var fmt = 'xxxxxxxxxx';
    return fmt.replace(/[x]/g, function(c) {
      var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16).toUpperCase();
    });
}

/***************************************
*
*              SCHEMAS
*
*
****************************************/
items = mongoose.Schema({

    'code'          : {type:String, required:true, unique:true, index:true, default: function(){ return generate(); }},
    'date'          : {type:Date, required:true, default: new Date()},
    'date_end'      : {type:Date},//En mongo se guarda la fecha en formato ISO la cual no añade las horas de GTM(en España +2), por eso luego usamos en el cliente toLocalDate para que añada las horas
    'status'        : {type:String, required:true, index:true, trim: true, uppercase: true, default:'EXPIRING'},
    'employee'      : {type:String, required:true, trim: true},
    'employee_id'   : {type:String, required:true},
    'products'      : {type:Array},
    'overview'      : {type:Object},
    'print'         : {type:String},
    'visible'       : {type:Boolean, default:true, required: true},
    'box'           : {}

});

itemModel = mongoose.model('tickets', items);

//itemModel.pre( "init", function (next) { console.log("pre init") });
/*
itemModel.schema.path('title').validate(function(value){
  
  return /^[a-z]{1}[a-z0-9\_]+$/.test(value) && value.length<16;
  
}, 'Invalid title');
*/
module.exports = itemModel;
