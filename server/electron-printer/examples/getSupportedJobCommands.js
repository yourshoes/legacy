var printer = require(".."), //=require('pritner')
    util = require('util');
console.log("supported job commands:\n"+util.inspect(printer.getSupportedJobCommands(), {colors:true, depth:10}));
