//'use strict';

/* Services */

var kzServices = angular.module('kalzate.services', []);

kzServices
.factory('Auth', ['$http', '$cookieStore', '$rootScope', function ($http, $cookieStore, $rootScope){

    var accessLevels    = routingConfig.accessLevels
        , userRoles     = routingConfig.userRoles
        , currentUser   = $cookieStore.get('kz-user') || { username: '', role: userRoles.public };

    //$cookieStore.remove('kz-user');

    function changeUser(user) 
    {
        angular.extend(currentUser, user);
        //console.log(currentUser);
        $cookieStore.put('kz-user', currentUser);
    };

    return {

        authorize: function (accessLevel, role)
        { 
            role = role || currentUser.role;

            return accessLevel.bitMask & role.bitMask;
        },

        isLoggedIn: function (user) 
        {
            user = user || currentUser;

            //if user is an employee or an admin then is logged in, otherwise not
            return user.role.title == userRoles.employee.title || user.role.title == userRoles.admin.title;
        },

        register: function (user, success, error) 
        {
            $http
            .post('/api/register', user)
            .success(function (res) 
            {
                changeUser(res);
                success();
            })
            .error(error);
        },

        login: function (user, success, error) 
        {
            //console.log(user);
            
            $http
            .post('/api/login', user)
            .success(function (user)
            {
                changeUser(user);
                success(user);
            })
            .error(error);
            /*user = { username: 'prueba', role: userRoles.employee };
            changeUser(user);
            success(user);*/
        },

        logout: function (success, error) 
        {
            $http
            .post('/api/logout')
            .success(function ()
            {
                changeUser({
                    username: '',
                    role: userRoles.public
                });
                $cookieStore.remove('kz-user');
                success();
            })
            .error(error);
        },

        setUserName: function (username) 
        {
            var before = currentUser.username;
            changeUser(username);
            $rootScope.$broadcast('usernameChanged',{before:before, current:currentUser.username});
            //Note: If Changin EditUser to a new State(removing it from the Modal), delete $rootScope from
            //Auth service arguments and only keep changeUser(username); in this function
        },

        accessLevels: accessLevels,

        userRoles: userRoles,

        user: currentUser
    };
}]);

kzServices
.factory('Colors', function (){

    var colorList = [

        /*{color:'AZUL', code:'#0000FF'},
        {color:'AZUL MARINO', code:'#120A8F'},
        {color:'AZUL OSCURO', code:'#000080'},
        {color:'BEIS', code:'#F5DEB3'},
        {color:'BLANCO', code:'#FFF'},
        {color:'BORGOÑA', code:'#800020'},
        {color:'CAFE', code:'#964B00'},
        {color:'CHOCOLATE', code:'#964B00'},
        {color:'CAMELLO', code:'#C19A6B'},
        {color:'FUCSIA', code:'#FD3F92'},
        {color:'GRIS', code:'#bebebe'},
        {color:'HIELO', code:'#A5F2F3'},
        {color:'JEANS', code:'#343f51'},
        {color:'CAQUI', code:'#f0e68c'},
        {color:'MARRON', code:'#964B00'},
        {color:'NEGRO', code:'#000'},
        {color:'NAVY', code:'#000080'},
        {color:'ORO', code:'#ffd700'},
        {color:'PLATA', code:'#C0C0C0'},
        {color:'PURPURA', code:'#660099'},
        {color:'ROSA', code:'#FFC0CB'},
        {color:'ROJO', code:'#FF0000'},
        {color:'TAUPE', code:'#483C32'},
        {color:'VERDE', code:'#00FF00'},
        {color:'VERDE OSCURO', code:'#006400'},


        {color:'CARMESI', code:'#DC143C'},
        {color:'BERMELLON', code:'#E34233'},
        {color:'ESCARLATA', code:'#FF2400'},
        {color:'GRANATE', code:'#800000'},
        {color:'CARMIN', code:'#960018'},
        {color:'AMARANTO', code:'#E52B50'},
        {color:'CHARTREUSE', code:'#7FFF00'},
        {color:'VERDE KELLY', code:'#4CBB17'},
        {color:'ESMERALDA', code:'#50C878'},
        {color:'JADE', code:'#00A86B'},
        {color:'VERDE VERONES', code:'#40826D'},
        {color:'ARLEQUIN', code:'#44944A'},
        {color:'ESPARRAGO', code:'#7BA05B'},
        {color:'VERDE OLIVA', code:'#6B8E23'},
        {color:'VERDE CAZADOR', code:'#355E3B'}*/

        {color:'AZUL', code:'#0000FF'},
        {color:'AZUL MARINO', code:'#120A8F'},
        {color:'BEIS', code:'#F5DEB3'},
        {color:'CAFE', code:'#964B00'},
        {color:'CHOCOLATE', code:'#845331'},
        {color:'CAMELLO', code:'#C19A6B'},
        {color:'FUCSIA', code:'#FD3F92'},
        {color:'GRIS', code:'#bebebe'},
        {color:'HIELO', code:'#A5F2F3'},
        {color:'KAQUI', code:'#f0e68c'},
        {color:'MARRON', code:'#964B00'},
        {color:'NEGRO', code:'#000'},
        {color:'ORO', code:'#ffd700'},
        {color:'PLATA', code:'#C0C0C0'},
        {color:'PURPURA', code:'#660099'},
        {color:'ROSA', code:'#FFC0CB'},
        {color:'ROJO', code:'#FF0000'},
        {color:'TAUPE', code:'#483C32'},
        {color:'VERDE', code:'#00FF00'},
        {color:'VERDE OSCURO', code:'#006400'},
        {color:'NEGRO/FUCSIA', code:'#000', code2:'#FD3F92'},
        {color:'NARANJA', code:'#DF7D00'},
        {color:'AZUL/BLANCO', code:'#0000FF', code2:'#FFF'},
        {color:'NEGRO/GRIS', code:'#000', code2:'#bebebe'}

    ];

    var getColorCode = function(color)
    {
        for(var i=0; i< colorList.length;i++)
        {
            if(colorList[i].color == color)
            {
                return colorList[i].code; 
            }   
        }
    };

    return {

        colorList: colorList,
        getColorCode : getColorCode
    };

});

kzServices
.factory('Converter', function (){
 'use strict';
    // Source: http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.

    var CSV = {};

    /**
     * Split CSV text into an array of lines.
     */
    function splitLines(text, lineEnding) {
        var strLineEnding = lineEnding.toString(),
            bareRegExp    = strLineEnding.substring(1, strLineEnding.lastIndexOf('/')),
            modifiers     = strLineEnding.substring(strLineEnding.lastIndexOf('/') + 1);

        if (modifiers.indexOf('g') === -1) {
            lineEnding = new RegExp(bareRegExp, modifiers + 'g');
        }

        // TODO: fix line splits inside quotes
        return text.split(lineEnding);
    }

    /**
     * If the line is empty (including all-whitespace lines), returns true. Otherwise, returns false.
     */
    function isEmptyLine(line) {
        return (line.replace(/^[\s]*|[\s]*$/g, '') === '');
    }

    /**
     * Removes all empty lines from the given array of lines.
     */
    function removeEmptyLines(lines) {
        var i;

        for (i = 0; i < lines.length; i++) {
            if (isEmptyLine(lines[i])) {
                lines.splice(i--, 1);
            }
        }
    }

    /**
     * Joins line tokens where the value of a token may include a character that matches the delimiter.
     * For example: "foo, bar", baz
     */
    function defragmentLineTokens(lineTokens, delimiter) {
        var i, j,
            token, quote;

        for (i = 0; i < lineTokens.length; i++) {
            token = lineTokens[i].replace(/^[\s]*|[\s]*$/g, '');
            quote = '';

            if (token.charAt(0) === '"' || token.charAt(0) === '\'') {
                quote = token.charAt(0);
            }

            if (quote !== '' && token.slice(-1) !== quote) {
                j = i + 1;

                if (j < lineTokens.length) {
                    token = lineTokens[j].replace(/^[\s]*|[\s]*$/g, '');
                }

                while (j < lineTokens.length && token.slice(-1) !== quote) {
                    lineTokens[i] += delimiter + (lineTokens.splice(j, 1))[0];
                    token = lineTokens[j].replace(/[\s]*$/g, '');
                }

                if (j < lineTokens.length) {
                    lineTokens[i] += delimiter + (lineTokens.splice(j, 1))[0];
                }
            }
        }
    }

    /**
     * Removes leading and trailing whitespace from each token.
     */
    function trimWhitespace(lineTokens) {
        var i;

        for (i = 0; i < lineTokens.length; i++) {
            lineTokens[i] = lineTokens[i].replace(/^[\s]*|[\s]*$/g, '');
        }
    }

    /**
     * Removes leading and trailing quotes from each token.
     */
    function trimQuotes(lineTokens) {
        var i;

        // TODO: allow for escaped quotes
        for (i = 0; i < lineTokens.length; i++) {
            if (lineTokens[i].charAt(0) === '"') {
                lineTokens[i] = lineTokens[i].replace(/^"|"$/g, '');
            } else if (lineTokens[i].charAt(0) === '\'') {
                lineTokens[i] = lineTokens[i].replace(/^'|'$/g, '');
            }
        }
    }

    /**
     * Converts a single line into a list of tokens, separated by the given delimiter.
     */
    function tokenizeLine(line, delimiter) {
        var lineTokens = line.split(delimiter);

        defragmentLineTokens(lineTokens, delimiter);
        trimWhitespace(lineTokens);
        trimQuotes(lineTokens);

        return lineTokens;
    }

    /**
     * Converts an array of lines into an array of tokenized lines.
     */
    function tokenizeLines(lines, delimiter) {
        var i,
            tokenizedLines = [];

        for (i = 0; i < lines.length; i++) {
            tokenizedLines[i] = tokenizeLine(lines[i], delimiter);
        }

        return tokenizedLines;
    }

    /**
     * Converts an array of tokenized lines into an array of object literals, using the header's tokens for each object's keys.
     */
    function assembleObjects(tokenizedLines) {
        var i, j,
            tokenizedLine, obj, key,
            objects = [],
            keys = tokenizedLines[0];

        for (i = 1; i < tokenizedLines.length; i++) {
            tokenizedLine = tokenizedLines[i];

            if (tokenizedLine.length > 0) {
                if (tokenizedLine.length > keys.length) {
                    throw new SyntaxError('not enough header fields');
                }

                obj = {};

                for (j = 0; j < keys.length; j++) {
                    key = keys[j];

                    if (j < tokenizedLine.length) {
                        obj[key] = tokenizedLine[j];
                    } else {
                        obj[key] = '';
                    }
                }

                objects.push(obj);
            }
        }

        return objects;
    }


    return { 

        csv2json: function (text, lineEnding, delimiter, ignoreEmptyLines) 
        {
            var config = {
                lineEnding:       /[\r\n]/,
                delimiter:        ',',
                ignoreEmptyLines: true
            },

            lines, tokenizedLines, objects;

            // Empty text is a syntax error!
            if (text === '') {
                throw new SyntaxError('empty input');
            }

            if (typeof lineEnding !== 'undefined') {
                if (lineEnding instanceof RegExp) {
                    config.lineEnding = lineEnding;
                } else {
                    config.lineEnding = new RegExp('[' + String(lineEnding) + ']', 'g');
                }
            }

            if (typeof delimiter !== 'undefined') {
                config.delimiter = String(delimiter);
            }

            if (typeof ignoreEmptyLines !== 'undefined') {
                config.ignoreEmptyLines = !!ignoreEmptyLines;
            }

            // Step 1: Split text into lines based on line ending.
            lines = splitLines(text, config.lineEnding);

            // Step 2: Get rid of empty lines. (Optional)
            if (config.ignoreEmptyLines) {
                removeEmptyLines(lines);
            }

            // Single line is a syntax error!
            if (lines.length < 2) {
                throw new SyntaxError('missing header');
            }

            // Step 3: Tokenize lines using delimiter.
            tokenizedLines = tokenizeLines(lines, config.delimiter);

            // Step 4: Using first line's tokens as a list of object literal keys, assemble remainder of lines into an array of objects.
            objects = assembleObjects(tokenizedLines);

            return objects;
        },

        json2csv: function (objArray) 
        {
            var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;

            var str = '';
            var line = '';

            if ($("#labels").is(':checked')) 
            {
                var head = array[0];
                if ($("#quote").is(':checked')) 
                {
                    for (var index in array[0]) 
                    {
                        var value = index + "";
                        line += '"' + value.replace(/"/g, '""') + '",';
                    }

                } 
                else 
                {
                    for (var index in array[0]) 
                    {
                        line += index + ',';
                    }
                }

                line = line.slice(0, -1);
                str += line + '\r\n';
            }

            for (var i = 0; i < array.length; i++) 
            {
                var line = '';

                if ($("#quote").is(':checked')) 
                {
                    for (var index in array[i]) 
                    {
                        var value = array[i][index] + "";
                        line += '"' + value.replace(/"/g, '""') + '",';
                    }
                } 
                else 
                {
                    for (var index in array[i]) 
                    {
                        line += array[i][index] + ',';
                    }
                }

                line = line.slice(0, -1);
                str += line + '\r\n';
            }

            return str; 
        }/*,

        json2table : function (json) 
        {

            var headerCount = new Object(),
                table = ''
                ;

            if (json.length > 0) 
            {
                var item, index = 0, i, j;

                table = '<table class="table text-center"><thead><tr><th class="text-center">Nº</th>';

                for (item in json[0]) 
                {
                   if (!headerCount.hasOwnProperty(item)) 
                   {
                       table += '<th class="text-center">'+ item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()+'</th>';
                       headerCount[item] = index;
                       index++;
                   }
                }

                table += '</tr></thead><tbody>';

                for (i = 0; i < json.length; i++) 
                {
                    var row = '<tr><td>'+(i+1)+'</td>';

                    for (j in json[i]) 
                    {
                        row += '<td>'+json[i][j]+'</td>';
               
                    }

                    table += row + '</tr>';
                }

                table += '</tbody></table>';
            }

            return table;
       }*/
    }
});



kzServices
.factory('Printer', function (){

    var qz;
    var detected = false;
    var printerName;
    var detect = function (printer, cb){ 

        if(qz && detected)
        {
            return cb(false);
        }

        printer = printer || 'termica';

        qz = document.getElementById('qz');

        if(typeof qz.findPrinter !== 'undefined')
        {
            qz.findPrinter(printer);
        
            monitorFinding(cb);
        }
        else
        {
            cb(true);
        }
        
    };

    function monitorFinding(cb)
    {
        if (!qz.isDoneFinding()) 
        {
            //console.log('not found!');
            setTimeout(function(){monitorFinding(cb)}, 500);
        } 
        else 
        {
            
            printerName = qz.getPrinter();

            //console.log('printer found: '+ printerName);
            if(!printerName)
            {
                return cb(true);
            }

            detected = true;
            
            cb(false);
        }
    }

    return {

        change : function(printer, cb)
        {
            if(printer)
            {
                detected = false;
                detect(printer, cb);
            }
        },
        getName: function()
        {
            return printerName;
        },
        print: function(data, cb)
        {
            //Si usamos impresora en el server:
            /*
            $http
            .post('/api/printer', {data:data})
            .success(function (response)
            {
                if(cb)cb(response);
            })
            .error(function(err){if(cb)cb(err);});
            */
            detect(data.printer, function (err){

                if(!err)
                {
                    
                    try
                    {
                        //$j =("\x1B\x40"); // reset printer
                        qz.appendHex("x1Bx40");
                        
                        if(data.openCashDrawer)
                        {
                            //qz.append(chr(27) + "\x70" + "\x30" + chr(25) + chr(25) + "\r");
                            qz.appendHex("x1Bx70x00x09x09");//27,112,0,9,9
                            //qz.appendHex("x1Bx07x32x1Ex1C");//27,7,50,30,28
                            //qz.appendHex("x1Bx70x00x32xFA");//27,112,0,50,250
                            
                            //qz.print();
                        }
                        //console.log('printing data: '+ data.content);
                        qz.append(data.content);
                        //qz.print();

                        if(data.cut)
                        {
                            qz.appendHex("x1Bx69");
                            //qz.print();
                        }

                        //While Qz Appending

                        qz.print();

                        //While QzPrinting

                    }
                    catch(e)
                    {

                        //console.log(e);
                        alert('UN ERROR HA OCURRIDO AL IMPRIMIR; CONTACTA AL ADMINISTRADOR');
                        detected = false;
                        if(cb) return cb(err);
                    }

                }

                if(cb)cb(err);
            });
        }/*,
        openCashDrawer: function()
        {
            if(typeof arguments[0] === 'string')
            {
                return detect(arguments[0], function(info){

                    if(!info.err)
                    {
                        //qz.append(chr(27) + "\x70" + "\x30" + chr(25) + chr(25) + "\r");
                        qz.appendHex("x1Bx70x00x09x09");//27,112,0,9,9
                        //qz.appendHex("x1Bx07x32x1Ex1C");//27,7,50,30,28
                        //qz.appendHex("x1Bx70x00x32xFA");//27,112,0,50,250
                        qz.print();
                    }

                    if(arguments[1])arguments[1](info);
                });
            }

            detect(null, function(info){

                if(!info.err)
                {
                    //qz.append(chr(27) + "\x70" + "\x30" + chr(25) + chr(25) + "\r");
                    qz.appendHex("x1Bx70x00x09x09");//27,112,0,9,9
                    //qz.appendHex("x1Bx07x32x1Ex1C");//27,7,50,30,28
                    //qz.appendHex("x1Bx70x00x32xFA");//27,112,0,50,250
                    qz.print();
                }

                if(arguments[0])arguments[0](info);
            });
        }*/
    };

});
/*


*/
/*
kzServices
.factory('Users', function ($http) {
    
    return {
        
        getAll: function (success, error) 
        {
            $http.get('/users')
            .success(success)
            .error(error);
        }
    };
});
*/
/*
// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('kapp.services', []).
  value('version', '0.1');
*/