(function(exports){

    const webFrame = require('electron').webFrame;
    webFrame.setZoomFactor(1.5);

    var config = {

        /* List all the roles you wish to use in the app
        * You have a max of 31 before the bit shift pushes the accompanying integer out of
        * the memory footprint for an integer
        */
        roles :[
            'public',
            'employee',
            'admin'],

        /*
        Build out all the access levels you want referencing the roles listed above
        You can use the "*" symbol to represent access to all roles
         */
        accessLevels : {
            'public' : "*",
            'anon': ['public'],//only public, employee and admin not awolled
            'employee' : ['employee', 'admin'],
            'admin': ['admin']
        }

    }

    exports.userRoles = buildRoles(config.roles);
    exports.accessLevels = buildAccessLevels(config.accessLevels, exports.userRoles);

    /*
        Method to build a distinct bit mask for each role
        It starts off with "1" and shifts the bit to the left for each element in the
        roles array parameter
     */

    function buildRoles(roles){

        var bitMask = "01";
        var userRoles = {};

        for(var role in roles){
            var intCode = parseInt(bitMask, 2);
            userRoles[roles[role]] = {
                bitMask: intCode,
                title: roles[role]
            };
            bitMask = (intCode << 1 ).toString(2)
        }

        return userRoles;
    }

    /*
    This method builds access level bit masks based on the accessLevelDeclaration parameter which must
    contain an array for each access level containing the allowed user roles.
     */
    function buildAccessLevels(accessLevelDeclarations, userRoles){

        var accessLevels = {};
        for(var level in accessLevelDeclarations){

            if(typeof accessLevelDeclarations[level] == 'string'){
                if(accessLevelDeclarations[level] == '*'){

                    var resultBitMask = '';

                    for( var role in userRoles){
                        resultBitMask += "1"
                    }
                    //accessLevels[level] = parseInt(resultBitMask, 2);
                    accessLevels[level] = {
                        bitMask: parseInt(resultBitMask, 2),
                        title: accessLevelDeclarations[level]
                    };
                }
                else console.log("Access Control Error: Could not parse '" + accessLevelDeclarations[level] + "' as access definition for level '" + level + "'")

            }
            else {

                var resultBitMask = 0;
                for(var role in accessLevelDeclarations[level]){
                    if(userRoles.hasOwnProperty(accessLevelDeclarations[level][role]))
                        resultBitMask = resultBitMask | userRoles[accessLevelDeclarations[level][role]].bitMask
                    else console.log("Access Control Error: Could not find role '" + accessLevelDeclarations[level][role] + "' in registered roles while building access for '" + level + "'")
                }
                accessLevels[level] = {
                    bitMask: resultBitMask,
                    title: accessLevelDeclarations[level][role]
                };
            }
        }

        return accessLevels;
    }

})(typeof exports === 'undefined' ? this['routingConfig'] = {} : exports);;'use strict';


// Declare app level module which depends on filters, and services
angular
.module('kalzate', ['kalzate.filters', 'kalzate.services', 'kalzate.directives', 'kalzate.controllers', 'ngCookies', 'ui.router', 'ui.bootstrap'])
.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

	var access = routingConfig.accessLevels;

    //Redirection
    //$urlRouterProvider.when('/shoes', '/shoes/page/1');
    
    $stateProvider
    .state('index', {
      url: "/",
      templateUrl: '/static/partials/home.html', 
      access: access.employee
    })
    .state('login', {
      url: "/login",
      templateUrl: '/static/partials/login.html', 
      controller: 'LoginCtrl', 
      access: access.anon
    })
    .state('register', {
      url: "/register",
      templateUrl: '/static/partials/register.html', 
      controller: 'RegisterCtrl', 
      access: access.anon
    })
    .state('recover', {
      url: "/recover",
      templateUrl: '/static/partials/recover.html', 
      controller: 'RecoverCtrl', 
      access: access.anon
    })
    .state('shoes', {
      url: "/shoes",
      templateUrl: '/static/partials/shoes.html',
      controller: 'ShoesCtrl',
      access: access.employee
    })
    .state('shoes.page', {
      url: "/page/{pageNo}",
      controller: 'ShoesPageCtrl',
      access: access.employee
    })
    .state('shoes.onemore', {
      url: "/onemore",
      templateUrl: '/static/partials/shoe_onemore.html',
      controller: 'OnemoreShoeCtrl',
      access: access.employee
    })
    .state('shoes.search', {
      url: "/search",
      templateUrl: '/static/partials/shoe_search.html',
      controller: 'SearchShoeCtrl',
      access: access.employee
    })
    .state('newShoe', {
      url: "/shoes/new",
      templateUrl: '/static/partials/shoe_new.html',
      controller: 'NewShoeCtrl',
      access: access.employee
    })
    .state('editShoe', {
      url: "/shoes/edit/:id",
      templateUrl: '/static/partials/shoe_edit.html',
      controller: 'EditShoeCtrl',
      access: access.employee
    })
    .state('tickets', {
      url: "/tickets?box",
      resolve:{emit:['$rootScope', function ($rootScope){
        return $rootScope;
      }]},
      templateUrl: '/static/partials/tickets.html',
      controller: 'TicketsCtrl',
      onExit: ['emit', function (emit) 
      {
        //console.log('onExit!', emit);

        emit.$broadcast('removeTicketId');
      }],
      access: access.employee
    })
    .state('tickets.return', {
      url: "/return/:code",
      templateUrl: '/static/partials/tickets_return.html',
      controller: 'TicketsReturnCtrl',
      access: access.employee
      /*,resolve:{

        newTicket : function ($scope,$http)
        {
            console.log('newTicket');

            $scope.progress = true;
            $scope.products = [];
            $scope.ticketNotice = {visible:false,code:0};
            $scope.ticketTotal = 0;
            $scope.ticketReceived = '0';
            $scope.ticketReturned = 0;
            $scope.ticketTax = 0;
            $scope.ticketDiscount = 0;
            $scope.changingQty = false;
            $scope.ticketPM = 'cash';
            $scope.processingTicket = false;
            

            $scope.shoes.reset();
            $scope.complements.reset();
            $scope.tickets.reset();

        }
      },
      onExit: function(newTicket){
        
        console.log('saliendo');

        newTicket();
      }*/
    })
    .state('tickets.reserve', {
      url: "/reservas/:code",
      templateUrl: '/static/partials/tickets_reserve.html',
      controller: 'TicketsReserveCtrl',
      access: access.employee
    })
    /*
    .state('box', {
      url: "/box",
      templateUrl: '//localhost:3000//static/partials/box.html',
      controller: 'BoxCtrl',
      access: access.employee
    })
    */
    /*.state('stock.page', {
      url: "stock/page/:pageNo",
      templateUrl: '//localhost:3000//static/partials/stock.page.html', 
      controller: 'StockPageCtrl', 
      access: access.employee
    })*/
    .state('error', {
      url: "/404",
      templateUrl: '/static/partials/404.html', 
      access: access.public
    });

    $urlRouterProvider.otherwise("/404");
    /*$routeProvider.when('/', {templateUrl: 'partials/home.html', access: access.employee});
    $routeProvider.when('/login', );
    $routeProvider.when('/stock', );
    $routeProvider.when('/404', );*/
    //$routeSegmentProvider.otherwise({redirectTo:'/404'});

    $locationProvider.html5Mode(true);

    var interceptor = ['$location', '$q', function ($location, $q)
    {
        
        function success(response) 
        {
            return response;
        }

        function error(response) 
        {
            if(response.status === 401) 
            {
                $location.path('/login');
            }

            return $q.reject(response);
        }

        return function(promise) 
        {
            return promise.then(success, error);
        }
    }];

    $httpProvider.responseInterceptors.push(interceptor);

}])
.run(['$rootScope', '$location', 'Auth', function ($rootScope, $location, Auth){

    $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams){
        
        $rootScope.error = null;

        //console.log('toState', toState);
        //If client is not authorize to visit the "next" url, check if logged in
        //access variable in next.access is given by the $routeProvider.when({...access:});
        if(!Auth.authorize(toState.access)) 
        {  
            if(!Auth.isLoggedIn())
            {
                //Keep track of the current path to redirect then to it
                $rootScope.transition = $location.path();
                $location.path('/login');
            } 
            //If user is already logged in and try to enter to login page
           else
           {
                $location.path('/');
                //console.log('El path:',$location.path());
           }
           
           event.preventDefault();
        }


    });

}]);

/*ng-class="{active: $routeSegment.startsWith('s1')}*/;//'use strict';

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
.factory('Printer', ["$http", function ($http){

    return {

        change : function(printer, cb)
        {
        },
        getName: function()
        {
        },
        print: function(data, cb)
        {

            $http
            .post('/api/print',{data: data})
            .success(function (response)
            {
                console.log("printed")
            })
            .error(function (err){

                cb(err);
            });

        }
    };

}]);
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
*/;/* Controllers */

angular.module('kalzate.controllers', [])
.controller('LoginCtrl', ['$rootScope', '$scope', '$location', '$window', 'Auth', 
	
	function ($rootScope, $scope, $location, $window, Auth) 
	{
    	$scope.error = false;
    	$scope.login = function() {

            Auth.login({
                username: $scope.username,
                password: $scope.password
            },function (res) {
                $scope.error = false;
                $location.path($rootScope.transition || '/');
            },function (err) {
                $scope.error = true;
            });

   		 };

    	$scope.loginOauth = function (provider) {
        	$window.location.href = '/auth/' + provider;
    	};
	}
])
.controller('RegisterCtrl', ['$scope', '$location', 'Auth', 
    
    function ($scope, $location, Auth) 
    {
        $scope.serverError = false;

        $scope.register = function() {
        
            Auth.register({
                username: $scope.username,
                email: $scope.email,
                password: $scope.password
            },function (res) {
                $scope.serverError = false;
                $location.path('/');
            },function (err) {
                $scope.serverError = true;
            });

         };
    }
])
.controller('RecoverCtrl', ['$scope', '$http', 
    
    function ($scope, $http) 
    {
        $scope.serverNotice = {visible:false, code:-1};

        $scope.recover = function() {
        
            $scope.serverNotice.visible = false;

            $http
            .post('/api/recover',{email: $scope.email})
            .success(function (response) 
            {
                //console.log(shoes);
                $scope.serverNotice.code = 0;
                $scope.serverNotice.visible = true;
            })
            .error(function (err){

                $scope.serverNotice.code = 1;
                $scope.serverNotice.visible = true;
            });

         };
    }
])
.controller('FooterCtrl', ['$http', '$scope', '$location', 'Auth', '$modal', function ($http, $scope, $location, Auth, $modal) {
    
    $scope.user = Auth.user;
    //$scope.userRoles = Auth.userRoles;
    //$scope.accessLevels = Auth.accessLevels;
    $scope.shutdown = function() {
        
        $http
        .post('/api/utils/shutdown')
        .success(function (response) 
        {
            //console.log('Apagando');
            delete localStorage.sessTickets;
            delete localStorage.boxes;
            $location.path('/login');
        })
        .error(function (err){

            //console.log('error al apagar')
        });
    };

    $scope.logout = function() {
        Auth.logout(function() {

            delete localStorage.sessTickets;
            delete localStorage.boxes;

            $location.path('/login');
        }, function() {
        });
    };

    $scope.openEdit = function()
    {
        var modalInstance = $modal.open({
          
          templateUrl: 'ModalEditUser.html',
          controller: 'ModalEditUserCtrl',
          backdrop: 'static',
          keyboard: false

        });

        modalInstance.result.then(function (data) {

            if(data.username)
            {
                Auth.setUserName(data);
            }
        });
    };

}])
.controller('ModalEditUserCtrl', ['$scope', '$http', '$modalInstance', function ($scope, $http, $modalInstance) {
    

    $scope.error=false;

    $scope.edit = function () 
    {
        $scope.error=false;

        $http
        .post('/api/user/edit',{username: $scope.username, password: $scope.password})
        .success(function (response) 
        {
            //console.log(shoes);
            $scope.error=false;
            $modalInstance.close({username:$scope.username});
        })
        .error(function (err){

            $scope.error=true;
        });
        
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };


}])
.controller('NavCtrl', ['$scope', '$window', function ($scope, $window) {
    
    $scope.navCollapsed = false;

    $scope.toTickets = function()
    {
        $window.location.href = '/tickets';//Solucion temporal
    }

    $scope.genID = 1;

    $scope.updateID = function()
    {
        $scope.genID = Math.floor((Math.random()*1000)+1);
        //console.log('here');
    }

}])
/*
.controller('PaginationCtrl', ['$scope', function ($scope) {
    
    $scope.totalItems = 664;
    $scope.currentPage = 1;
    $scope.maxSize = 5;
    $scope.itemsPerPage = 10;

    $scope.setPage = function (page) {
        
        console.log('page is '+page)
    };

}])
*/
.controller('ShoesCtrl', ['$scope', '$http', '$cookieStore', '$location', 'Colors', '$modal',
    function ($scope, $http, $cookieStore, $location, Colors, $modal) {

    //var pageNo = $stateParams.pageNo || 1;
    var searchingPage;

    $scope.progress = false;
    $scope.pagination = {

        totalItems      : 0,
        currentPage     : 1,//pageNo,
        maxSize         : 5,
        itemsPerPage    : parseInt(localStorage['kz-stock-ipp']) || 10,
        setPage         : function (page) 
        {
            //console.log('page is '+page)
            //$location.path('/shoes/page/'+page);
            $scope.pagination.currentPage = page;

            for(var offset=0,limit=$scope.pagination['itemsPerPage'],i=1;i<page;i++,offset+=limit);

            //console.log(pageNo,offset,limit);
            $scope.pagination.getItems(offset,limit);
        },
        setItemsPerPage : function ()
        {
            localStorage['kz-stock-ipp'] = $scope.pagination['itemsPerPage'];

            $scope.pagination.setPage($scope.pagination.currentPage);
            //reloadOnSearch: true -> NO FUNCIONA AUN CON UI-ROUTER
            //$location.search('display',$scope.pagination['itemsPerPage']);
            //$window.location.href = '/shoes';
        },
        getItems : function(offset, limit)
        {
            $scope.progress = true;

            $http
            .post('/api/shoes',{search: $scope.searching, order: $scope.order, offset:offset, limit:limit})
            .success(function (shoes) 
            {
                //console.log(shoes);
                $scope.pagination['totalItems'] = shoes.count;
                $scope.items = shoes.items;
                $scope.progress = false;
            });
            /*
            .error(function (err){

                $location.path('/404');
            });
            */
        },
        search: function()
        {
            var page = 1;

            if( $scope.query.reference == '' && 
                $scope.query.brand == '' && 
                $scope.query.size == '' &&
                $scope.query.reference == '' && 
                $scope.query.category == '' && 
                $scope.query.color == '')
            {
                $scope.searching = false
                page = searchingPage;
            }
            else
            {
                $scope.searching = {};

                if($scope.query.reference)
                {
                    $scope.searching['reference'] = $scope.query.reference;
                }

                if($scope.query.brand)
                {
                    //console.log('brand!!!');
                    $scope.searching['brand'] = $scope.query.brand;
                }

                if($scope.query.size)
                {
                    $scope.searching['size'] = $scope.query.size;
                }

                if($scope.query.category)
                {
                    $scope.searching['category'] = $scope.query.category;
                }

                if($scope.query.color)
                {
                    //console.log($scope.query.color);
                    if(typeof $scope.query.color === 'object')
                    {
                        $scope.searching['color'] = $scope.query.color['color'];
                    }
                    else
                    {
                        $scope.searching['color'] = $scope.query.color;
                    }
                }

                searchingPage = $scope.pagination.currentPage;
            }    

            $scope.pagination.setPage(page);
        },
    };

    $scope.searching = false;
    $scope.query = {

        reference:'',
        size:'',
        brand:'',
        category:'',
        color:''
    };
    $scope.colors = Colors.colorList;
    $scope.getColorCode = Colors.getColorCode;
    $scope.items_modified = true;
    //Tiene la desventaja de que si añadimos uno nuevo tenemos que refrescar par que aparezca, pero solo hace una request!
    $scope.references = [];
    $http.post('/api/shoes/fields',{field:'reference'})
    .success(function (response) 
    {
        //console.log(response);
        $scope.references = response;
    });

    /*
    //Tiene la ventaja de que si añadimos uno nuevo automaticamente aparecera, pero hace muchas requests!
    $scope.references = function(code)
    {
        return $http.post('/api/shoes/references',{ref:code})
        .then(function (response) 
        {
            return response.data;
        });
    }
    */

    $scope.delSearch = function()
    {
        $scope.query = {

            reference:'',
            size:'',
            brand:'',
            category:'',
            color:''
        };

        $scope.pagination.search();
    };

    $scope.updateSearch = function(t)
    {

        if($scope.query[t] == '' && $scope.searching)
        {
            var empty = false;

            for(var key in $scope.query) 
            {
                if(key != t && $scope.query[key] != '')
                {
                    empty = true;
                    break;
                }
            }

            if(!empty)
            {
                $scope.searching = false;
                $scope.pagination.setPage(searchingPage);
            }
            else
            {
                $scope.pagination.search();
            }
        }
        /*
        if( $scope.query.reference == '' && 
            $scope.query.brand == '' && 
            $scope.query.size == '' &&
            $scope.query.reference == '' && 
            $scope.query.category == '' && 
            $scope.query.color == '' &&
            $scope.searching)
        {
            $scope.searching = false;
            $scope.pagination.setPage(searchingPage);
            return;
        }*/
    };

    $scope.caret = {

        'reference':true,
        'size':true,
        'brand':true,
        'quantity':true,
        'color':true,
        'price':true,
        'category':true
    }
    $scope.order = {'_id': -1};
    $scope.orderShoes = function(order)
    {

        if(order in $scope.order)
        {
            $scope.order[order] *= -1;
        }
        else
        {
            $scope.order = {};
            $scope.order[order] = -1;

        }

        $scope.caret[order] = !$scope.caret[order];
        $scope.pagination.setPage($scope.pagination.currentPage);
    };

    $scope.removeShoe = function(id)
    {
         $http.post('/api/shoes/remove',{id:id})
        .success(function (references) 
        {
            //$scope.references = references;
            $scope.pagination.setPage($scope.pagination.currentPage);
        });
    };

    $scope.editShoe = function(id)
    {
        $location.path('/shoes/edit/'+id);
    };

    $scope.barCode = function(barcode)
    {
        
        $modal.open({
          
          templateUrl: 'ModalBCShoes.html',
          controller: 'ModalBCShoesCtrl',
          backdrop: 'static',
          keyboard: false,
          resolve: {
            barcode: function () {
              return barcode;
            }
          }
        });
    };

    $scope.qrCode = function(id, has_qr, index)
    {
        var modalInstance = $modal.open({
          
          templateUrl: 'ModalQRShoes.html',
          controller: 'ModalQRShoesCtrl',
          backdrop: 'static',
          keyboard: false,
          resolve: {
            info: function () {
              return {id:id,has_qr:has_qr};
            }
          }

        });

        modalInstance.result.then(function (data) {

            $scope.items[index]['has_qr'] = true;
        });
    };

    $scope.openPrint = function()
    {
        var modalInstance = $modal.open({
          
          templateUrl: 'ModalPrintShoes.html',
          controller: 'ModalPrintShoesCtrl',
          backdrop: 'static',
          keyboard: false,
          resolve: {
            modified: function () {
              return $scope.items_modified;
            }
          }

        });

        modalInstance.result.then(function () {

            $scope.items_modified = false;
        });
    };

    $scope.openImport = function () {

        var modalInstance = $modal.open({
          
          templateUrl: 'ModalImportShoes.html',
          controller: 'ModalImportShoesCtrl',
          backdrop: 'static',
          keyboard: false

        });

        modalInstance.result.then(function (data) {

            /*if(data.remove)
            {
                $scope.items = data.items.slice(0, $scope.pagination['itemsPerPage']);
                $scope.pagination['totalItems'] = data.count;
            }
            else
            {
                $scope.items = $scope.items.concat(data.items).slice(0, $scope.pagination['itemsPerPage']);
                $scope.pagination['totalItems'] += data.count;
            }
            
            $scope.items_modified = true;
            */
            $http.post('/api/shoes/fields',{field:'reference'})
            .success(function (response) 
            {
                //console.log(response);
                $scope.references = response;
                $scope.items_modified = true;

                $scope.pagination.setPage(1);
            });
            
        });

    };

    
        /*
        return $http.jsonp("http://gd.geobytes.com/AutoCompleteCity?callback=JSON_CALLBACK &filter=US&q="+code)
        .then(function(response){
            console.log(response);
          return response.data;
        });
        */
    /*
    $scope.downloadCSV = function () {

        $http
        .get('/api/shoes/export/csv')
        .success(function (csv) 
        {
            var blob = new Blob([ csv ], { type : 'text/csv' });
            var url = (window.URL || window.webkitURL).createObjectURL( blob );
            var link = document.createElement('a');
              
            angular.element(link)
            .attr('href', url)
            .attr('download', 'zapatos.csv') // Pretty much only works in chrome
            
            link.click();
        })
        .error(function (err){

            alert('Error al generar datos. Consulte al Administrador');
        });
    };
    */
    if($location.path().indexOf('page') == -1)
        $scope.pagination.getItems(0,$scope.pagination['itemsPerPage']);
    
}])
.controller('ModalImportShoesCtrl', ['$scope', '$http', 'Converter', '$modalInstance', function ($scope, $http, Converter, $modalInstance) {
    
    $scope.files = [];
    $scope.fileError = {code:0, msg:'', visible:false};
    $scope.progress = false;
    $scope.displayCSV = false;
    $scope.remove = false;

    $scope.ok = function () 
    {
        $scope.progress = true;

        //Let's join all files
        var items = [];

        for(var i=0;i<$scope.files.length;i++)
        {
            items = items.concat($scope.files[i]['data']);
        }

        //items.reverse();

        //console.log('remove is:', $scope.remove);
        //$modalInstance.close({count:items.length, items:items, remove: $scope.remove});
        $http
        .post('/api/shoes/import', {items:items,remove:$scope.remove})
        .success(function () 
        {
            //$modalInstance.close({count:items.length, items:items.reverse(), remove: $scope.remove});
            $modalInstance.close();
        })
        .error(function (err){

            $scope.fileError['code']= 3;
            $scope.fileError['visible']= true;
            $scope.progress = false;
        });
    };

    $scope.display = function () {
        $scope.displayCSV = true;
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.closeTab = function(i)
    {
        if(~i)
        {
            $scope.files.splice(i, 1);

            if(!$scope.files.length)
            {
               $scope.displayCSV = false; 
            }
            
        }
    };

    $scope.newFile = function (file)
    {
        try
        {
            for(var i=0;i<$scope.files.length;i++)
            {
                if($scope.files[i]['name'] == file['name'])
                {
                    return;
                }   
            }

            file['data'] = Converter.csv2json(file['data']);

            //file['table'] = Converter.json2table(file['data']);

            $scope.files.push(file);

        }
        catch(e)
        {
            console.log(e);

            /*
            NOTA: Poner los codigos en el servicio Converter
            switch(e.getCode())
            {
                case 1: scope.fileError['msg']= "El Fichero CSV no tiene suficientes campos de cabecera";break;
                case 2: scope.fileError['msg']= "El Fichero CSV no contiene datos";break;
                case 3: scope.fileError['msg']= "El Fichero CSV no tiene ucabecera";break;
            }*/

            $scope.fileError['code']= 0;
            $scope.fileError['msg']= "El fichero CSV contiene errores";
            $scope.fileError['visible']= true;
            //scope.fileError['msg']= e.getMessage();
        }

    };

    /*
    DOWNLOAD A CSV 

    var json = $.parseJSON($("#json").val());
    var csv = Converter.json2csv(json);
    window.open("data:text/csv;charset=utf-8," + escape(csv))

    */

}])
.controller('ModalPrintShoesCtrl', ['$scope', '$http', '$modalInstance', 'modified', function ($scope, $http, $modalInstance, modified) {
    
    $scope.progress = true;
    $scope.error = false;


    if(modified)
    {
        $http
        .get('/api/shoes/export/pdf')
        .success(function (data) 
        {
            /*if(!data['cache'])
            {
               $timeout(function(){

                $scope.pdf = '/static/barcodes/zapatos_barcodes.pdf';
                $scope.progress = false

                }, 8000);  
            }
            else
            {
                $scope.pdf = '/static/barcodes/zapatos_barcodes.pdf';
                $scope.progress = false
            }
            */
            $scope.pdf = '/static/barcodes/zapatos_barcodes.pdf';
            $scope.progress = false

        })
        .error(function (err){

            $scope.progress = false;
            $scope.error = true;
        });
    }
    else
    {
        $scope.pdf = '/static/barcodes/zapatos_barcodes.pdf';
        $scope.progress = false
    }
    

    $scope.ok = function()
    {
        $modalInstance.close();
    };

}])
.controller('ModalQRShoesCtrl', ['$scope', '$http', '$modalInstance', 'info', function ($scope, $http, $modalInstance, info) {
    
    $scope.progress = true;
    $scope.error = false;
    $scope.qr = '';

    $http
    .post('/api/shoes/qr', info)
    .success(function (dataURL) 
    {
       $scope.qr = dataURL['qr'];
       $scope.progress = false;

    })
    .error(function (err){

        $scope.progress = false;
        $scope.error = true;
    });

    $scope.ok = function()
    {
        $modalInstance.close();
    };

    $scope.print = function()
    {
        var printWindow = window.open('', 'Imprimir foto','height=400,width=600');
        printWindow.document.write('<html><head>');
        printWindow.document.write('</head><body ><img src="');
        printWindow.document.write($scope.qr);
        printWindow.document.write('" /></body></html>');
        printWindow.document.close();
        printWindow.print();
    };


}])
.controller('ModalBCShoesCtrl', ['$scope', '$http', '$modalInstance', 'barcode', function ($scope, $http, $modalInstance, barcode) {
    
    $scope.progress = true;
    $scope.error = false;
    $scope.barcode = '/static/barcodes/'+barcode+'.png';

    $scope.onError = function(index)
    {
        $http
        .post('/api/shoes/barcode', {barcode:barcode})
        .success(function (dataURL) 
        {
           $scope.barcode = dataURL;
           $scope.progress = false;
        })
        .error(function (err){

            $scope.progress = false;
            $scope.error = true;
        });
    };

    $scope.onLoad = function()
    {
        $scope.progress = false;
    };

    $scope.ok = function()
    {
        $modalInstance.close();
    };

    $scope.print = function()
    {
        var printWindow = window.open('', 'Imprimir foto','height=400,width=600');
        printWindow.document.write('<html><head>');
        printWindow.document.write('</head><body ><img src="');
        printWindow.document.write($scope.barcode);
        printWindow.document.write('" /></body></html>');
        printWindow.document.close();
        printWindow.print();
    };

}])
.controller('ShoesPageCtrl', ['$scope','$stateParams', '$http', function ($scope, $stateParams, $http) {
    
    var pageNo = $stateParams.pageNo || 1;

    $scope.pagination.currentPage = pageNo;

    for(var offset=0,limit=$scope.pagination['itemsPerPage'],i=1;i<pageNo;i++,offset+=limit);

    //console.log(pageNo,offset,limit);
    $scope.pagination.getItems(offset,limit);

}])
.controller('OnemoreShoeCtrl', ['$scope', '$http', function ($scope, $http) {
    
    $scope.color = '';
    $scope.category = 'MUJERES';
    //    'Negro','Blanco','Azúl', 'Verde', 'Rojo', 'Amarillo', 'Violeta', 'Marrón', 'Beige'];
    $scope.addShoe = function()
    {
        
        var item = {

                reference: $scope.reference.toUpperCase(), 
                brand: $scope.brand.toUpperCase(), 
                category: $scope.category,
                size: $scope.size, 
                color: ($scope.color['color'] ? $scope.color['color'] : $scope.color), 
                price: $scope.price,
                quantity: $scope.quantity
        };

        $http
        .post('/api/shoes/add', item)
        .success(function (response) 
        {
            if(response)
            {
                $scope.pagination['totalItems'] += 1;

                //Añadimos referencia para la busqueda
                $scope.references.push(item.reference);

                if($scope.searching)
                {
                    return $scope.pagination.search();
                }

                if($scope.items.length < $scope.pagination['itemsPerPage'])
                {
                    $scope.items.unshift(response);
                }
                else
                {
                    $scope.items.pop();
                    $scope.items.unshift(response);
                }

                // $scope.reference = '';
                // $scope.brand = '';
                // $scope.category = 'MUJERES';
                // $scope.size = ''; 
                // $scope.color = ''; 
                // $scope.price = '';
                // $scope.quantity = '';

                $scope.items_modified = true;
            }
            else
            {
                alert('Oh No!, tenemos un problema, consulta al administrador con este codigo: OnemoreShoeCtrl-addShoe');
            }
        })
        .error(function (err){

            alert('Oh No!, un error detectado consulta al administrador con este codigo: '+err);
        
        });
    };

    $scope.reset = function ()
    {
        $scope.reference = '';
        $scope.brand = '';
        $scope.category = 'MUJERES';
        $scope.size = ''; 
        $scope.color = ''; 
        $scope.price = '';
        $scope.quantity = '';
    }

}])
.controller('SearchShoeCtrl', ['$scope', '$http', function ($scope, $http) {
    
    $scope.brands = [];
    $http.post('/api/shoes/fields',{field:'brand'})
    .success(function (response) 
    {
        //console.log(response);
        $scope.brands = response;
    });

}])
.controller('NewShoeCtrl', ['$scope', '$http', '$location', 'Colors', 'Auth',
    function ($scope, $http, $location, Colors, Auth) {

    $scope.images = [];
    $scope.imagesError = {code:0, msg:'', visible:false};
    $scope.progress = false;
    $scope.color = '';
    $scope.category = 'MUJERES';
    $scope.season = 'INVIERNO';
    $scope.colors = Colors.colorList;
    $scope.keywords = '';

    $scope.newFile = function (file)
    {
        $scope.progress = true;

        $http
        .post('/api/upload', file)
        .success(function (url) 
        {
            $scope.progress = false;
            //console.log(url);
            file['url'] = url;
            $scope.images.push(file);
        })
        .error(function (err){

            $scope.imagesError['code']= 3;
            $scope.imagesError['visible']= true;
            $scope.progress = false;
        });
    };

    $scope.closeImg = function(index)
    {
        //$scope.progress = true;
        $scope.images.splice(index, 1);
        /*$http
        .post('/api/photo/delete', $scope.images[index]['url'])
        .success(function () 
        {
            $scope.progress = false;
            $scope.images.splice(index, 1);
        })
        .error(function (err){

            $scope.imagesError['code']= 3;
            $scope.imagesError['visible']= true;
            $scope.progress = false;
        });*/
    };

    $scope.create = function()
    {
        $scope.progress = true;

        var img = [];

        for(var i=0;i<$scope.images.length;i++)
        {
            img.push($scope.images[i]['url']);
        }

        var item = {

            reference: $scope.reference.toUpperCase(), 
            brand: $scope.brand.toUpperCase(), 
            category: $scope.category,
            size: $scope.size, 
            color: $scope.color['color'], 
            price: $scope.price,
            quantity: $scope.quantity,
            season: $scope.season,
            maker: $scope.maker,
            provider: $scope.provider,
            location:$scope.location,
            keywords: $scope.keywords.split(',') || [],
            description: $scope.description,
            comments: [{text:$scope.comments, date: new Date(), employee: Auth.user['username']}],
            images: img
        };

        //console.log(item);

        $http
        .post('/api/shoes/add', item)
        .success(function (response) 
        {
            if(response)
            {
                $location.path('/shoes')
            }
            else
            {
                $scope.imagesError['code']= 4;
                $scope.imagesError['visible']= true;
            }

            $scope.progress = false;
        })
        .error(function (err){

            $scope.imagesError['code']= 4;
            $scope.imagesError['visible']= true;
            $scope.progress = false;
        });
    };

    $scope.safeApply = function (fn) 
    {
      var phase = this.$root.$$phase;
      if (phase == '$apply' || phase == '$digest') 
      {
        if (fn && (typeof(fn) === 'function')) 
        {
          fn();
        }
      } 
      else 
      {
        this.$apply(fn);
      }
    };

    $scope.submit = function()
    {
        //console.log($scope.stockForm);
        var fireOnThis = document.getElementById('stock-add-form');
            
        if (Event)
        {
            fireOnThis.dispatchEvent(new Event('submit'));
        }
        else 
        {
            if (document.createEvent) 
            {
                var evObj = document.createEvent('HTMLEvents');
                evObj.initEvent('submit', true, false);
                fireOnThis.dispatchEvent(evObj);
            }
            else if (document.createEventObject) 
            { //IE
                var evObj = document.createEventObject();
                fireOnThis.fireEvent( 'onSubmit', evObj );
            } 
        }  
    };

    
}])
.controller('EditShoeCtrl', ['$scope', '$http', '$location', 'Colors', 'Auth','$stateParams',
    function ($scope, $http, $location, Colors, Auth, $stateParams) {

    var ID = $stateParams.id;

    $scope.initProgress = true;
    $scope.imagesError = {code:0, msg:'', visible:false};
    $scope.progress = false;
    $scope.colors = Colors.colorList;

    $http
    .get('/api/shoes/get/'+encodeURI(ID))
    .success(function (shoe) 
    {
        $scope.reference = shoe['reference'];
        $scope.brand = shoe['brand'];
        $scope.size = shoe['size'];
        $scope.color = shoe['color'];

        if(shoe['price'] > 0)
        {
            $scope.price = parseFloat(shoe['price']);
        }

        if(shoe['quantity'] > 0)
        {
            $scope.quantity = shoe['quantity'];
        }

        $scope.category = shoe['category'] || '';
        $scope.season = shoe['season'] || '';
        $scope.maker = shoe['maker'] || '';
        $scope.provider = shoe['provider'] || '';
        $scope.keywords = shoe['keywords'].join(',') || '';
        $scope.location = shoe['location'] || '';
        $scope.description = shoe['description'] || '';
        //$scope.comments = shoe['comments'][0] || '';

        $scope.images = [];

        for(var i=0;i<shoe['images'].length;i++)
        {
            var url = shoe['images'][i];
            $scope.images.push({data : url, name: url.substr(url.indexOf('_')+1), url : url})
        }

        $scope.initProgress = false;

    })
    .error(function (err){

        $location.path('/shoes');
    });

    $scope.newFile = function (file)
    {
        $scope.progress = true;

        $http
        .post('/api/upload', file)
        .success(function (url) 
        {
            $scope.progress = false;
            //console.log(url);
            file['url'] = url;
            $scope.images.push(file);
        })
        .error(function (err){

            $scope.imagesError['code']= 3;
            $scope.imagesError['visible']= true;
            $scope.progress = false;
        });
    };

    $scope.closeImg = function(index)
    {
        //$scope.progress = true;
        $scope.images.splice(index, 1);
    };

    $scope.edit = function()
    {
        $scope.progress = true;

        var img = [];

        for(var i=0;i<$scope.images.length;i++)
        {
            img.push($scope.images[i]['url']);
        }

        //console.log($scope.keywords);
        var item = {

            reference: $scope.reference.toUpperCase(), 
            brand: $scope.brand.toUpperCase(), 
            category: $scope.category,
            size: $scope.size, 
            color: $scope.color['color'], 
            price: $scope.price,
            quantity: $scope.quantity,
            season: $scope.season,
            maker: $scope.maker,
            provider: $scope.provider,
            location:$scope.location,
            keywords: $scope.keywords.split(',') || [],
            description: $scope.description,
            //comments: [{text:$scope.comments, date: new Date(), employee: Auth.user['username']}],
            images: img
        };

        $http
        .post('/api/shoes/edit/'+encodeURI(ID), item)
        .success(function (response) 
        {
            if(response)
            {
                $location.path('/shoes')
            }
            else
            {
                $scope.imagesError['code']= 3;
                $scope.imagesError['visible']= true;
            }

            $scope.progress = false;
        })
        .error(function (err){

            $scope.imagesError['code']= 3;
            $scope.imagesError['visible']= true;
            $scope.progress = false;
        });
    };

    $scope.safeApply = function (fn) 
    {
      var phase = this.$root.$$phase;
      if (phase == '$apply' || phase == '$digest') 
      {
        if (fn && (typeof(fn) === 'function')) 
        {
          fn();
        }
      } 
      else 
      {
        this.$apply(fn);
      }
    };

    $scope.submit = function()
    {
        //console.log($scope.stockForm);
        var fireOnThis = document.getElementById('shoes-edit-form');
            
        if (Event)
        {
            fireOnThis.dispatchEvent(new Event('submit'));
        }
        else 
        {
            if (document.createEvent) 
            {
                var evObj = document.createEvent('HTMLEvents');
                evObj.initEvent('submit', true, false);
                fireOnThis.dispatchEvent(evObj);
            }
            else if (document.createEventObject) 
            { //IE
                var evObj = document.createEventObject();
                fireOnThis.fireEvent( 'onSubmit', evObj );
            } 
        }  
    };
    
}])
.controller('TicketsCtrl', ['$scope', '$http', '$cookieStore', '$window', '$state', 'Colors', '$modal', '$stateParams', 'Printer',
    function ($scope, $http, $cookieStore, $window, $state, Colors, $modal, $stateParams, Printer) {

    
    /*General*/
    /*
    $scope.colors = Colors.colorList;
    $scope.getColorCode = Colors.getColorCode;
    $scope.progress = true;
    */
    /*tickets*/
    /*
    $scope.products = [];
    $scope.ticketNotice = {visible:false,code:0};
    $scope.ticketTotal = 0;
    $scope.ticketReceived = '0';
    $scope.ticketReturned = 0;
    $scope.ticketTax = 0;
    $scope.ticketDiscount = 0;
    $scope.changingQty = false;
    $scope.ticketPM = 'cash';
    $scope.processingTicket = false;
    $scope.ticketCode = '';
    */

    var ticketCode = '';
    $scope.box = $stateParams.box || '';
    //var ticketTotalRated = 0;

    $scope.setOldTicket = function(ticket, type)
    {
        $scope.oldTicketActived = type || true;
        
        $scope.oldTicketInfo = {code:ticket.overview.code, total:ticket.overview.total};
        $scope.ticketTax = ticket.overview.tax;
        $scope.ticketDiscount = ticket.overview.discount;
        $scope.ticketTotal = $scope.oldTicketInfo.total;
    }

    $scope.hasPaid = function ()
    {
        var received = parseFloat($scope.ticketReceived.replace(',','.'));

        if(isNaN(received))received = 0;

        return received >= $scope.ticketTotal;
    };

    $scope.computeExchange = function()
    {
        if($scope.hasPaid())
        {
            var received = parseFloat($scope.ticketReceived.replace(',','.'));

            if(isNaN(received)) received = 0;

            $scope.ticketReturned = (received - $scope.ticketTotal).toFixed(2);

            if($scope.ticketReturned == 0)
            {
                $scope.ticketReturned = 0;
            }
            //var num = parseFloat($scope.ticketReceived.replace(',','.')) - $scope.ticketTotal;
            //$scope.ticketReturned = (Math.round(num*Math.pow(10,2))/Math.pow(10,2)).toFixed(2);
        }
        else
        {
            $scope.ticketReturned = 0;
        }
    }

    $scope.applySubRate = function(i)
    {
        var item = $scope.products[i],
            discount = item.discount.replace(',','.')
            ;

        if( isNaN(parseFloat(discount)) || parseFloat(discount) <= 0 )
        {
            //item.discount = '0';
            item.subtotal = item.price*item.quantity;
            return $scope.applyRate();
        }

        if(discount.indexOf('%') > -1)
        {
            var discount_percent = parseFloat(discount.replace('%',''));

            var percent = item.price*item.quantity*discount_percent/100;

            item.subtotal = Math.round(((item.price*item.quantity)-percent)*Math.pow(10,2))/Math.pow(10,2);
        }
        else
        {
            item.subtotal = Math.round(((item.price*item.quantity)-parseFloat(discount))*Math.pow(10,2))/Math.pow(10,2);
        }

        item.subtotal = item.subtotal < 0 ? 0 : item.subtotal;

        return $scope.applyRate();
    }

    $scope.applyRate = function(tax)
    {
        var taxAmount = $scope.ticketTax - $scope.ticketDiscount;

        var ticketTotalRated = 0;
        for(var j=0;j<$scope.products.length;j++)
        {
            ticketTotalRated += parseFloat($scope.products[j]['subtotal']);
        }

        if($scope.oldTicketActived == 'booked')
        {
            ticketTotalRated += $scope.oldTicketInfo.total;
        }

        var percentage = (ticketTotalRated*taxAmount)/100;

        $scope.ticketTotal = (Math.round((percentage+ticketTotalRated)*Math.pow(10,2))/Math.pow(10,2));

        if($scope.oldTicketActived == 'returned')
        {
            // console.log($scope.ticketTotal, $scope.oldTicketInfo.total)
            $scope.ticketTotal += $scope.oldTicketInfo.total;

            if(taxAmount != 0)
            {
                var percentage = ($scope.ticketTotal*taxAmount)/100;

                $scope.ticketTotal = (Math.round((percentage+$scope.ticketTotal)*Math.pow(10,2))/Math.pow(10,2));
            }

        }

        $scope.ticketTotal = $scope.ticketTotal.toFixed(2);

        $scope.computeExchange();
    }

    $scope.addToTicket = function (isShoe, i)
    {

        if($scope.processingTicket)
        {
            return;
        }

        if(isShoe)
        {
            
            if($scope.shoes['items'][i]['quantity'] <= 0)
            {
                return;
            }

            //Ir a la BD y añadir $scope.shoes['items'][i], devuelve id del producto añadido
            for(var j=0;j<$scope.products.length;j++)
            {
                if($scope.products[j]['_id'] == $scope.shoes['items'][i]['_id'])
                {
                    
                    var productPromise = {

                        '_id':$scope.products[j]['_id'],
                        'quantity':$scope.products[j]['quantity']+1,
                        'qa':$scope.products[j]['quantity']
                    };

                    return $http
                    .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
                    .success(function (response) 
                    {
                        $scope.products[j]['qa'] = $scope.products[j]['quantity'];
                        $scope.products[j]['quantity']++;
                        $scope.shoes['items'][i]['quantity']--;
                        $scope.products[j].shoe_qty--;
                        $scope.applySubRate(j);
                    })
                    .error(function (err)
                    {
                        $scope.ticketNotice = {visible:true,code:3};
                    });
                }
            }
            
            var productPromise = {

                '_id':$scope.shoes['items'][i]['_id'],
                'quantity':1,
                'qa':0
            };

            $http
            .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
            .success(function (response) 
            {
                
                $scope.shoes['items'][i]['quantity']--;

                productPromise['reference'] = $scope.shoes['items'][i]['reference'];
                productPromise['description'] = $scope.shoes['items'][i]['brand']+', '+$scope.shoes['items'][i]['size']+', '+$scope.shoes['items'][i]['color'];
                productPromise['price'] = $scope.shoes['items'][i]['price'];
                productPromise['discount'] = '0';
                productPromise['subtotal'] = $scope.shoes['items'][i]['price'];
                productPromise['type'] = 's';
                productPromise['shoe_qty'] = $scope.shoes['items'][i]['quantity'];
                
                $scope.products.push(productPromise);
                $scope.applyRate();
            })
            .error(function (err)
            {
                $scope.ticketNotice = {visible:true,code:3};
            });

        }
        else
        {
            var desc = $scope.complements.brand ? $scope.complements.brand : '';

            if(typeof $scope.complements.color === 'object')
            {
                if(desc == '')
                {
                    desc += $scope.complements.color['color'];
                }
                else
                {
                    desc += ', '+$scope.complements.color['color'];
                }  
            }

            for(var j=0;j<$scope.products.length;j++)
            {
                if( $scope.products[j]['reference'] == $scope.complements.reference &&
                    $scope.products[j]['description'] == desc &&
                    $scope.products[j]['price'] == $scope.complements.price)
                {
                    $scope.products[j]['quantity'] +=$scope.complements.quantity;
                    $scope.applySubRate(j);
                    return;
                }
            }

            $scope.products.push({

                'reference':$scope.complements.reference,
                'description':desc,
                'quantity':$scope.complements.quantity,
                'price':$scope.complements.price,
                'discount':'0',
                'subtotal':$scope.complements.quantity*$scope.complements.price,
                'type':'c'
            });

            $scope.applyRate();
        }
    }

    /*EXPERIMENTAL*/

    var sessTickets = [];

    if(!localStorage.boxes)
    {
        localStorage.boxes = 1;
    }
    else
    {
        localStorage.boxes = parseInt(localStorage.boxes)+1;
    }

    /*try
    {
        // http://www.opera.com/support/kb/view/827/
        opera.setOverrideHistoryNavigationMode('compatible');
        history.navigationMode = 'compatible';
    }
    catch(e){}*/

    $window.onbeforeunload = function () {
        
        if($scope.ticketId)
        {
            sessTickets = (localStorage.sessTickets || '').split(","); 
            var sti = sessTickets.indexOf($scope.ticketId);

            if( sti > -1)
            {
                sessTickets.splice(sti,1);
                localStorage.sessTickets = sessTickets.join(",");

                if(localStorage.boxes > 1)
                {
                    $http
                    .post('/api/ticket/new', {session:sessTickets})
                    .success(function (response){});
                }
                
            }
        }

        var boxes = parseInt(localStorage.boxes);
        if(boxes)
        {
            localStorage.boxes = boxes-1;
        }
        
    };

    $scope.$on('removeTicketId', function(e){

        if($scope.ticketId)
        {
            sessTickets = (localStorage.sessTickets || '').split(","); 
            var sti = sessTickets.indexOf($scope.ticketId);

            if( sti > -1)
            {
                sessTickets.splice(sti,1);
                localStorage.sessTickets = sessTickets.join(",");

                if(localStorage.boxes > 1)
                {
                    $http
                    .post('/api/ticket/new', {session:sessTickets})
                    .success(function (response){});
                }
            }
        }

        var boxes = parseInt(localStorage.boxes);
        if(boxes)
        {
            localStorage.boxes = boxes-1;
        }

    });

    /*EXPERIMENTAL*/

    $scope.newTicket = function (fn)
    {
        $scope.progress = true;
        $scope.products = [];
        $scope.ticketNotice = {visible:false,code:0};
        $scope.ticketTotal = 0;
        $scope.ticketReceived = '0';
        $scope.ticketReturned = 0;
        $scope.ticketTax = 0;
        $scope.ticketDiscount = 0;
        $scope.changingQty = false;
        $scope.ticketPM = 'cash';
        $scope.processingTicket = false;

        $scope.shoes.reset();
        $scope.complements.reset();
        $scope.tickets.reset();

        $scope.oldTicketActived = false;
        $scope.oldTicketInfo = null
        ticketCode = '';


        $scope.payment_method.reset();

        /*EXPERIMENTAL*/

        if(localStorage.sessTickets)
        {
            sessTickets = localStorage.sessTickets.split(",");
        }

        if($scope.ticketId)
        {
            var sti = sessTickets.indexOf($scope.ticketId);

            if(sti > -1)
            {
                sessTickets.splice(sti,1);
                localStorage.sessTickets = sessTickets.join(",");
            }
        }

        /*EXPERIMENTAL*/

        $http
        //.post('/api/ticket/new')
        .post('/api/ticket/new', {session:sessTickets})
        .success(function (response) 
        {
            //console.log(response);
            $scope.ticketId = response._id;
            ticketCode = response.code;

            if(!$scope.shoes['references'].length && 
               !$scope.shoes['brands'].length &&
               !$scope.tickets['codes'].length &&
               !$scope.tickets['employees'].length)
            {

                $http.post('/api/ticket/getFields')
                .success(function (response) 
                {
                    $scope.shoes['references'] = response.references || [];
                    $scope.shoes['brands'] = response.brands || [];
                    $scope.tickets['codes'] = response.codes || [];
                    $scope.tickets['employees'] = response.employees || [];

                    /*EXPERIMENTAL*/
                    sessTickets.push($scope.ticketId);
                    localStorage.sessTickets = sessTickets.join(",");
                    /*EXPERIMENTAL*/

                    if(fn)
                    {
                        fn();
                    }
                    else
                    {
                        $scope.progress = false;
                    }
                    
                });
            }
            else
            {
                /*EXPERIMENTAL*/
                sessTickets.push($scope.ticketId);
                localStorage.sessTickets = sessTickets.join(",");
                /*EXPERIMENTAL*/

                if(fn)
                {
                    fn();
                }
                else
                {
                    $scope.progress = false;
                }
            }       
        })
        .error(function (err){

            console.log('error');
            
            setTimeout(function(){

                $scope.newTicket();

            },1000);
            
        });
    }

    $scope.removeFromTicket = function (i,isShoe)
    {
        if($scope.processingTicket)
        {
            return;
        }

        if(!isShoe)
        {
            $scope.products.splice(i,1);

            if(!$scope.products.length)
            {
                
                if($scope.oldTicketActived)
                {
                    $scope.ticketTotal = $scope.oldTicketInfo.total;
                    return $scope.computeExchange();
                }

                return $scope.newTicket();
            }

            $scope.applyRate();
            return;
        }

        var productPromise = {

            '_id':$scope.products[i]['_id'],
            'quantity':0,
            'qa':$scope.products[i]['quantity']
        };

        $http
        .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
        .success(function (response) 
        {

            $scope.products.splice(i,1);

            //solo efecto visual
            for(var j=0;j<$scope.shoes['items'].length;j++)
            {
                if($scope.shoes['items'][j]['_id'] == productPromise['_id'])
                {
                    $scope.shoes['items'][j]['quantity'] += productPromise.qa;
                }
            }


            if(!$scope.products.length)
            {
                
                if($scope.oldTicketActived)
                {
                    $scope.ticketTotal = $scope.oldTicketInfo.total;
                    return $scope.computeExchange();
                }

                return $scope.newTicket();
            } 

            $scope.applyRate();
        })
        .error(function (err)
        {
            $scope.ticketNotice = {visible:true,code:3};
        });
        
    }

    $scope.incQty = function (i,isShoe)
    {
        if($scope.processingTicket)
        {
            return;
        }

        if(!isShoe)
        {
            var product = $scope.products[i];
            product.quantity++;
            $scope.applySubRate(i);
            return;
        }

        $scope.changingQty = true;

        var productPromise = {

            '_id':$scope.products[i]['_id'],
            'quantity':$scope.products[i]['quantity']+1,
            'qa':$scope.products[i]['quantity']
        };

        $http
        .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
        .success(function (response) 
        {
            
            for(var j=0;j<$scope.shoes['items'].length;j++)
            {
                if($scope.shoes['items'][j]['_id'] == productPromise['_id'])
                {
                    $scope.shoes['items'][j]['quantity']--;
                }
            }

            var product = $scope.products[i];
            product.qa = product.quantity;
            product.quantity++;
            product.shoe_qty--;

            $scope.applySubRate(i);
            $scope.changingQty = false;
        })
        .error(function (err)
        {
            $scope.ticketNotice = {visible:true,code:3};
            $scope.changingQty = false;
        });
    }

    $scope.decQty = function (i,isShoe)
    {
        if($scope.processingTicket)
        {
            return;
        }

        if(!isShoe)
        {
            var product = $scope.products[i];
            product.quantity--;
            $scope.applySubRate(i);
            return;
        }

        if($scope.products[i]['quantity'] > 1)
        {
            $scope.changingQty = true;

            var productPromise = {

                '_id':$scope.products[i]['_id'],
                'quantity':$scope.products[i]['quantity']-1,
                'qa':$scope.products[i]['quantity']
            };

            $http
            .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
            .success(function (response) 
            {
                for(var j=0;j<$scope.shoes['items'].length;j++)
                {
                    if($scope.shoes['items'][j]['_id'] == productPromise['_id'])
                    {
                        $scope.shoes['items'][j]['quantity']++;
                    }
                }

                var product = $scope.products[i];
                product.qa = product.quantity;
                product.quantity--;
                product.shoe_qty++;

                $scope.applySubRate(i);
                $scope.changingQty = false;
            })
            .error(function (err)
            {
                $scope.ticketNotice = {visible:true,code:3};
                $scope.changingQty = false;
            });

        }
    }

    $scope.finishTicket = function (type, edit, products)
    {
        products = products || $scope.products;

        $scope.processingTicket = true;
        $scope.ticketNotice.visible = false;

        var overview = {

            'total':$scope.ticketTotal,
            'payment_method':$scope.ticketPM,
            'returned':$scope.ticketReturned,
            'received':$scope.ticketReceived,
            'discount':$scope.ticketDiscount,
            'tax':$scope.ticketTax,
            'code':ticketCode
        };

        if($scope.ticketPM == 'combined')
        {
            overview['combined_cash'] = $scope.payment_method.combined_cash;
            overview['combined_credit'] = $scope.payment_method.combined_credit;
            overview['combined_voucher'] = $scope.payment_method.combined_voucher;
        }

        if(parseInt($scope.ticketDiscount) > 0)
        {
            var percentage = $scope.ticketTotal*$scope.ticketDiscount/100;

            overview.total_discount = (Math.round((parseFloat($scope.ticketTotal)-percentage)*Math.pow(10,2))/Math.pow(10,2)).toFixed(2);
        }

        if($scope.oldTicketActived)
        {
            overview['update_code'] = $scope.oldTicketInfo.code;
        }

        $http
        .post('/api/ticket/'+type,{'_id':$scope.ticketId, 'overview':overview, 'products':products})
        .success(function (response) 
        {
            
            $scope.tickets['codes'].push(ticketCode);

            //Abrir Caja

            if(!edit)
            {
                //Se imprime directamente(response)
                Printer.print({cut:true, content:response, openCashDrawer:true}, function(err){

                    if(err)
                    {
                        console.log('printer not detected!');
                    }
                    
                });          

                //Vamos a nuevo ticket
                return $scope.newTicket();
            }

            var modalInstance = $modal.open({
  
              templateUrl: 'ModalPrintTicket.html',
              controller: 'ModalPrintTicketCtrl',
              backdrop: 'static',
              keyboard: false,
              resolve: {
                ticket: function () {
                  return response;
                }
              }

            });

            modalInstance.result.then(function (data) {

                if($scope.oldTicketActived)
                {
                    return $scope.newTicket(function(){

                        $scope.progress = false;

                        if($scope.box != '')
                        {
                            $state.go('tickets',{box:$scope.box});
                        }
                        else
                        {
                            $state.go('tickets');
                        }
                        //$location.path("/tickets/"+$scope.box);
                        //$location.path("/tickets");
                    });
                }

                $scope.newTicket();
            });

            $scope.processingTicket = false;
            
        })
        .error(function (err)
        {
            $scope.ticketNotice = {visible:true,code:1};
            $scope.processingTicket = false;
        });
    };

    /*Shoes*/
    $scope.shoes = {

        barcode:'',
        reference:'',
        brand:'',
        size:'',
        color:'',
        category:''
    };
    $scope.shoes['thPosition'] = "up";
    $scope.shoes['items'] = [];
    $scope.shoes['searching'] = {};
    $scope.shoes['references'] = [];
    $scope.shoes['brands'] = [];
    $scope.shoes['order'] = {'_id':-1};
    $scope.shoes['pagination'] = {

        totalItems      : 0,
        maxSize         : 5,
        itemsPerPage    : 4,
        setPage         : function (page) 
        {
            //$location.path('/shoes/page/'+page);
            $scope.shoes['pagination']['currentPage'] = page;

            for(var offset=0,limit=$scope.shoes['pagination']['itemsPerPage'],i=1;i<page;i++,offset+=limit);

            //console.log(pageNo,offset,limit);
            $scope.shoes['pagination'].getItems(offset,limit);
        },
        getItems : function(offset, limit)
        {
            $http
            .post('/api/shoes',{search: $scope.shoes['searching'], order: $scope.shoes['order'], offset:offset, limit:limit})
            .success(function (shoes) 
            {
                //console.log(shoes);
                $scope.shoes['pagination']['totalItems'] = shoes.count;
                $scope.shoes['items'] = shoes.items;
                $scope.shoes['pagination']['pages'] = Math.ceil(shoes.count/4);
                //if(shoes.count)
                //    $scope.shoes['thPosition'] = "down";
            });
        },
        search: function()
        {

            if( $scope.shoes.barcode == '' && 
                $scope.shoes.reference == '' && 
                $scope.shoes.brand == '' && 
                $scope.shoes.size == '' &&
                $scope.shoes.category == '' && 
                $scope.shoes.color == '')
            {
                $scope.shoes['items'] = [];
                $scope.shoes['pagination']['pages'] = 0;
                $scope.shoes['pagination']['totalItems'] = 0;
            }
            else
            {
                $scope.shoes['searching'] = {};

                if($scope.shoes['barcode'])
                {
                    $scope.shoes['searching']['barcode'] = $scope.shoes['barcode'];
                }

                if($scope.shoes['reference'])
                {
                    $scope.shoes['searching']['reference'] = $scope.shoes['reference'];
                }

                if($scope.shoes['brand'])
                {
                    $scope.shoes['searching']['brand'] = $scope.shoes['brand'];
                }

                if($scope.shoes['size'])
                {
                    $scope.shoes['searching']['size'] = $scope.shoes['size'];
                }

                if($scope.shoes['category'])
                {
                    $scope.shoes['searching']['category'] = $scope.shoes['category'];
                }

                if($scope.shoes['color'])
                {
                    if(typeof $scope.shoes['color'] === 'object')
                    {
                        $scope.shoes['searching']['color'] = $scope.shoes['color']['color'];
                    }
                    else
                    {
                        $scope.shoes['searching']['color'] = $scope.shoes['color'];
                    }
                }

                $scope.shoes['pagination']['setPage'](1);
            }  
        }
    };

    $scope.shoes.reset = function ()
    {
        $scope.shoes.barcode = '';
        $scope.shoes.reference = '';
        $scope.shoes.brand = '';
        $scope.shoes.size = '';
        $scope.shoes.color = '';
        $scope.shoes.category = '';
        $scope.shoes['items'] = [];
        $scope.shoes['pagination']['pages'] = 0;
        $scope.shoes['pagination']['totalItems'] = 0;
    }

    /*Complements*/
    $scope.complements = {};
    $scope.complements['references'] = ['BOLSOS','CINTURONES','BISUTERIA','TOCADOS', 'MONEDEROS', 'PAÑUELOS'];
    $scope.complements.reset = function ()
    {
        $scope.complements.reference = '';
        $scope.complements.brand = '';
        $scope.complements.color = '';
        $scope.complements.price = '';
        $scope.complements.quantity = '';
    }

    /*Shoes and Complements*/
    $scope.colors = Colors.colorList;
    $scope.getColorCode = Colors.getColorCode;

    /*Tickets*/
    $scope.tickets = {

        code:'',
        state:'',
        date:'',
        employee:''
    };
    $scope.tickets['items'] = [];
    $scope.tickets['searching'] = {};
    $scope.tickets['codes'] = [];
    $scope.tickets['employees'] = [];
    $scope.tickets['states'] = ['VENDIDO','RESERVADO'];
    $scope.tickets['order'] = {'_id':-1};
    $scope.tickets['pagination'] = {

        totalItems      : 0,
        maxSize         : 5,
        itemsPerPage    : 4,
        setPage         : function (page) 
        {
            //$location.path('/shoes/page/'+page);
            $scope.tickets['pagination']['currentPage'] = page;

            for(var offset=0,limit=$scope.tickets['pagination']['itemsPerPage'],i=1;i<page;i++,offset+=limit);

            //console.log(pageNo,offset,limit);
            $scope.tickets['pagination'].getItems(offset,limit);
        },
        getItems : function(offset, limit)
        {
            $http
            .post('/api/tickets/get',{search: $scope.tickets['searching'], order: $scope.tickets['order'], offset:offset, limit:limit})
            .success(function (tickets) 
            {
                $scope.tickets['items'] = tickets.items;
                $scope.tickets['pagination']['totalItems'] = tickets.count;
                $scope.tickets['pagination']['pages'] = Math.ceil(tickets.count/4);
                //if(shoes.count)
                //    $scope.shoes['thPosition'] = "down";
            })
            .error(function(){

                $scope.tickets['items'] = [];
                $scope.tickets['pagination']['totalItems'] = 0;
                $scope.tickets['pagination']['pages'] = 0;
            });
        },
        search: function()
        {

            if( $scope.tickets.code == '' && 
                $scope.tickets.employee == '' && 
                $scope.tickets.date == '' &&
                $scope.tickets.state == '')
            {
                $scope.tickets['items'] = [];
                $scope.tickets['pagination']['pages'] = 0;
                $scope.tickets['pagination']['totalItems'] = 0;
            }
            else
            {
                $scope.tickets['searching'] = {};

                if($scope.tickets['code'])
                {
                    $scope.tickets['searching']['code'] = $scope.tickets['code'];
                }

                if($scope.tickets['state'])
                {
                    $scope.tickets['searching']['status'] = $scope.tickets['state'];
                }

                if($scope.tickets['employee'])
                {
                    $scope.tickets['searching']['employee'] = $scope.tickets['employee'];
                }

                if($scope.tickets['date'])
                {
                    $scope.tickets['searching']['date'] = $scope.tickets['date'];
                }

                $scope.tickets['pagination']['setPage'](1);
            }  
        }
    };

    $scope.tickets.reset = function ()
    {
        $scope.tickets.code = '';
        $scope.tickets.state = '';
        $scope.tickets.date = '';
        $scope.tickets.employee = '';
        $scope.tickets['items'] = [];
        $scope.tickets['pagination']['pages'] = 0;
        $scope.tickets['pagination']['totalItems'] = 0;
    }

    $scope.tickets['setToday']= function (date, mode) {
        
        $scope.tickets['date'] = (new Date()).toLocaleDateString();
        $scope.tickets['pagination']['search']();
    };

    $scope.tickets['parseDate']= function (date) {
        
        return (new Date(date)).toLocaleDateString();
        /*date = date.substr(0,10).split('-');
        return date[2]+'/'+date[1]+'/'+date[0];*/
    };

    var abortedInfo;
    $scope.tickets['abortTicket']= function (code, i) {
        
        if(i)
        {
            $scope.tickets['items'][i]['disabled'] = true;
        }

        $scope.ticketNotice = {visible:false,code:0};

        if(abortedInfo)
        {
            $http
            .post('/api/ticket/abort', abortedInfo)
            .success(function (response) 
            {
                
                if(response.error)
                {
                    abortedInfo['loop_index'] = response.error;
                    abortedInfo['updated'] = response.updated || false;
                    
                    if(i)
                    {
                       $scope.tickets['items'][i]['disabled'] = false; 
                    }
                    
                    $scope.ticketNotice = {visible:true,code:1};
                    return;
                }

                if($state.current['name'].indexOf('reserve') > -1)
                {
                    abortedInfo = null;
                    return $scope.newTicket(function(){

                        $scope.progress = false;

                        if($scope.box != '')
                        {
                            $state.go('tickets',{box:$scope.box});
                        }
                        else
                        {
                            $state.go('tickets');
                        }
                        
                    });
                }

                $scope.tickets['items'].splice(i,1);
                $scope.tickets['pagination']['totalItems']--;
                $scope.tickets['pagination']['pages'] = Math.ceil($scope.tickets['pagination']['totalItems']/4);

                abortedInfo = null;

            })
            .error(function(){

                if(i)
                {
                   $scope.tickets['items'][i]['disabled'] = false; 
                }

                $scope.ticketNotice = {visible:true,code:1};
            });
        }
        else
        {
            $http
            .post('/api/ticket/get/sessionTicket', {'code':code})
            .success(function (info) 
            {
                
                abortedInfo = {

                    'loop_index':0, 
                    'products':info.ticket.products, 
                    '_id':info.sessTicket['_id'], 
                    'overview':info.ticket.overview,
                    'updated':false
                };

                $http
                .post('/api/ticket/abort', abortedInfo)
                .success(function (response) 
                {
                    
                    if(response.error)
                    {
                        abortedInfo['loop_index'] = response.error;
                        abortedInfo['updated'] = response.updated || false;

                        if(i)
                        {
                           $scope.tickets['items'][i]['disabled'] = false; 
                        }
                        
                        $scope.ticketNotice = {visible:true,code:1};
                        return;
                    }

                    if($state.current['name'].indexOf('reserve') > -1)
                    {
                        abortedInfo = null;
                        return $scope.newTicket(function(){

                            $scope.progress = false;

                            if($scope.box != '')
                            {
                                $state.go('tickets',{box:$scope.box});
                            }
                            else
                            {
                                $state.go('tickets');
                            }
                            
                        });
                    }

                    $scope.tickets['items'].splice(i,1);
                    $scope.tickets['pagination']['totalItems']--;
                    $scope.tickets['pagination']['pages'] = Math.ceil($scope.tickets['pagination']['totalItems']/4);

                    abortedInfo = null;
                })
                .error(function(){

                    if(i)
                    {
                       $scope.tickets['items'][i]['disabled'] = false; 
                    }

                    $scope.ticketNotice = {visible:true,code:1};
                });

            })
            .error(function(){

                if(i)
                {
                   $scope.tickets['items'][i]['disabled'] = false; 
                }

                $scope.ticketNotice = {visible:true,code:1};
            });
        }
        
    };

    $scope.tickets['reprintTicket']= function (index) {
        
        //Send to print: $scope.tickets.items[i]['print'];
        Printer.print({cut:true, content:$scope.tickets.items[index]['print'], openCashDrawer:false}, function (err){

            if(err)
            {
                console.log('printer not detected!');
            }
            else
            {
                console.log('printer detected: '+Printer.getName());
            }

        }); 
    };

    /*DELETE THIS BLOCK IF CHANGING EDIT USER TO A NEW STATE*/
    $scope.$on('usernameChanged', function(e, args){

        //console.log(e,args);
        var index = $scope.tickets['employees'].indexOf(args.before);

        if(index > -1)
        {
            $scope.tickets['employees'].splice(index,1);
        }

        $scope.tickets['employees'].push(args.current);
    });
    /*END BLOCK*/

    /*Box*/
    $scope.box = {

        // dateFrom:'',
        // dateTo:'',
        date:'',
        // dp_open:false,
        // dateOptions:
        // {
        //     'starting-day': 1,
        //     'min':'2014-01-01'
        //     // ,'max':(new Date()).toISOString().substr(0,10)
        // },
        // dateDisabled: function(date, mode)
        // {
        //     //Disable weekend
        //     return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
        // },
        // datePicker: function($event)
        // {
        //     $event.preventDefault();
        //     $event.stopPropagation();

        //     $scope.box.dp_open = true;
        // },
        initialCash:'',
        progress:false,
        result:[],
        total:0,
        total_stack:0
    };

    $scope.box['makeBox'] = function (today)
    {
        $scope.box.progress = true;

        var info = {};

        if($scope.box.date)
        {
            info.date = $scope.box.date;
        }
        else
        {
            info.date = (new Date()).toLocaleDateString();
        }

        // if($scope.box.dateFrom != '')
        // {
        //     info.dateFrom = $scope.box.dateFrom;
        // }
        // else
        // {
        //     info.dateFrom = (new Date()).toLocaleDateString();
        // }

        // if($scope.box.dateTo != '')
        // {
        //     info.dateTo = $scope.box.dateTo;
        // }
        // else
        // {
        //     info.dateTo = (new Date()).toLocaleDateString();
        // }

        console.log(info);

        $http
        .post('/api/box/get',info)
        .success(function (data) 
        {
            $scope.box.progress = false;

            if(!data.box.length)
            {
                $scope.box.result = [];
                $scope.box.total = 0;
                return
            }

            for(var i=0; i<data.box.length; i++)
            {
                data.box[i].total_cash = data.box[i].total_cash.toFixed(2);
                data.box[i].total_credit = data.box[i].total_credit.toFixed(2);
                data.box[i].total_rcash = data.box[i].total_rcash.toFixed(2);
                data.box[i].total = data.box[i].total.toFixed(2);
                data.box[i].total_box = (parseFloat(data.box[i].total_cash) + parseFloat(data.box[i].total_rcash)).toFixed(2);
            }

            $scope.box.result = data.box;
            $scope.box.total = data.total.toFixed(2);
        })
        .error(function(){
            $scope.box.progress = false;
        });
    };

    $scope.box['applyInitCash'] = function()
    {
        $scope.box.total -= $scope.box.total_stack;
        $scope.box.total_stack = $scope.box.initialCash;
        $scope.box.total += $scope.box.initialCash;
        
    };

    $scope.box['printToPDF'] = function()
    {
        var printWindow = window.open('', 'Imprimir Resumen Caja','height=400,width=600');
        printWindow.document.write('<html><head>');
        printWindow.document.write('</head><body >');
        printWindow.document.write(document.getElementById('tickets_box_summary').outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    $scope.box['printToTicket'] = function()
    {
        var ticket = "\r\n\r\nTICKET RESUMEN DE CAJA CON FECHA: "+((new Date()).toLocaleDateString())+"\r\nHORA: "+((new Date()).toLocaleTimeString())+"\r\n\r\n",
            len = $scope.box['result'].length-1;

        for(var i=0;i<len;i++)
        {
            ticket += 'Emplead@: '+$scope.box.result[i]['employee']+' | Ventas: '+$scope.box.result[i]['ordered']+"\r\n";
            ticket += 'Devoluciones(Vales): '+$scope.box.result[i]['returned_voucher']+' | Devoluciones(Efectivo): '+$scope.box.result[i]['returned_cash']+"\r\n";
            ticket += 'Devoluciones Sin Emision: '+$scope.box.result[i]['returned_plus_ordered']+' | Efectivo Devuelto: '+$scope.box.result[i]['total_rcash']+" Euros\r\n";
            ticket += 'Reservas: '+$scope.box.result[i]['booked']+' | Anulaciones: '+$scope.box.result[i]['cancelled']+"\r\n";
            ticket += 'Total Efectivo: '+$scope.box.result[i]['total_cash']+' Euros | Total T. Cred.: '+$scope.box.result[i]['total_credit']+" Euros\r\n";
            ticket += 'Total Tickets: '+$scope.box.result[i]['total_tickets']+' | Total: '+$scope.box.result[i]['total']+" Euros\r\n";
            ticket += 'Caja: '+($scope.box.result[i]['total_cash']+$scope.box.result[i]['total_rcash'])+' Euros | Caja FINAL: '+($scope.box.result[i]['total_cash']+$scope.box.result[i]['total_rcash']+$scope.box.initialCash)+" Euros\r\n\r\n";
        }

        ticket += "------------------------------------------\r\n\r\n";
        ticket += 'Total Tickets: '+$scope.box.result[len]['total_tickets']+' | Ventas: '+$scope.box.result[len]['ordered']+"\r\n";
        ticket += 'Devoluciones(Vales): '+$scope.box.result[len]['returned_voucher']+' | Devoluciones(Efectivo): '+$scope.box.result[len]['returned_cash']+"\r\n";
        ticket += 'Devoluciones Sin Emision: '+$scope.box.result[len]['returned_plus_ordered']+' | Efectivo Devuelto: '+$scope.box.result[len]['total_rcash']+" Euros\r\n";
        ticket += 'Reservas: '+$scope.box.result[len]['booked']+' | Anulaciones: '+$scope.box.result[len]['cancelled']+"\r\n";
        ticket += 'Total Efectivo: '+$scope.box.result[len]['total_cash']+' Euros | Total T. Cred.: '+$scope.box.result[len]['total_credit']+" Euros\r\n";
        ticket += 'Total: '+$scope.box.result[len]['total']+' Euros | Total + Deposito Inicial: '+($scope.box.result[len]['total']+$scope.box.initialCash)+" Euros\r\n";
        ticket += 'Caja: '+($scope.box.result[len]['total_cash']+$scope.box.result[len]['total_rcash'])+' Euros | Caja FINAL: '+($scope.box.result[len]['total_cash']+$scope.box.result[len]['total_rcash']+$scope.box.initialCash)+" Euros\r\n\r\n";
        
        ticket += "------------------------------------------\r\n\r\n";
        ticket += "-   -   -   -   -   -   -   -   -   -   -\r\n\r\n\r\n";

        return Printer.print({cut:true, content:ticket, openCashDrawer:true}, function (err){

            if(err)
            {
                console.log('printer not detected!', err);
            }
            else
            {
                console.log('printer detected',err);
            }
            
        });

    };

    $scope.box['reset'] = function ()
    {
        $scope.box.dateFrom = '';
        $scope.box.dateTo = '';
        $scope.box.initialCash = '';
        $scope.box.progress = false;
        $scope.box.result = [];
        $scope.box.total = 0;
        $scope.box.total_stack = 0;
    }

    /* Payment Method */
    $scope.payment_method = {};

    $scope.payment_method['reset'] = function (type)
    {
        if(type == 'voucher' && $scope.ticketTotal > 0)
        {
            $scope.payment_method.voucher = true;
            $scope.payment_method.combined = false;
            return;
        }

        if(type == 'combined' && $scope.ticketTotal > 0)
        {
            $scope.payment_method.combined = true;
            $scope.payment_method.voucher = false;
            $scope.payment_method.combined_cash = 0;
            $scope.payment_method.combined_credit = 0;
            $scope.payment_method.combined_voucher = 0;
            $scope.payment_method['compute_combined']();
            return;
        }

        $scope.payment_method.voucher_code = '';
        $scope.payment_method.voucher_code_error = false;
        $scope.payment_method.voucher = false;
        $scope.payment_method.combined = false;
    }

    $scope.payment_method['validate'] = function ()
    {
        $scope.payment_method.voucher_code_error = false;

        if($scope.payment_method.voucher_code != '')
        {
            $http
            .post('/api/ticket/voucher/validate', {'code':$scope.payment_method.voucher_code})
            .success(function (voucher) 
            {
                
                if(voucher)
                {
                    //go ahead
                    $scope.ticketReceived = voucher.total.toString();
                    $scope.payment_method.voucher_code = '';
                    $scope.payment_method.voucher = false;

                    if(voucher.total < $scope.ticketTotal)
                    {
                        $scope.payment_method.combined = true;
                        $scope.ticketPM = 'combined';
                        //Set voucher in combined payment method
                        $scope.payment_method.combined_voucher = voucher.total;
                        $scope.payment_method['compute_combined']();
                    }

                    $scope.computeExchange();
                }
                else
                {
                    //We do nothing, just warn user about it
                    $scope.payment_method.voucher_code_error = true;
                }

            })
            .error(function(){

                $scope.payment_method.voucher_code_error = true;
            });
        }
    }

    $scope.payment_method.combined_needed = 0;

    $scope.payment_method['compute_combined'] = function ()
    {
        var total = ($scope.payment_method.combined_cash || 0) + ($scope.payment_method.combined_credit || 0) + ($scope.payment_method.combined_voucher || 0);

        $scope.ticketReceived = total.toString();
        
        $scope.computeExchange();

        $scope.payment_method.combined_needed = ($scope.ticketTotal - total).toFixed(2);
    }

    /*Kick off*/
     if($state.current['name'].indexOf('return') == -1 &&  $state.current['name'].indexOf('reserve') == -1)
    {
        $scope.newTicket();
        //console.log('kick off!');
    }
    /*
    if($location.path().indexOf('return') == -1 &&  $location.path().indexOf('reservas') == -1)
    {
        $scope.newTicket();
        console.log('kick off!');
    }
    */
    /*
    $scope.$on('$destroy', function() {

      // release resources, cancel request...
      console.log('destroying!');
      //window.clearInterval(newTicketError);
    });

    $scope.$on('$viewContentLoaded', function() {

    });
    */ 

}])
.controller('ModalPrintTicketCtrl', ['$scope', '$modalInstance', 'ticket', 'Printer', function ($scope, $modalInstance, ticket, Printer) {
    
    $scope.ticket = ticket;

    $scope.print = function()
    {
        /*
        if(not_detected)
        {
            $scope.no_printer();
            return;
        }
        */

        Printer.print({content:$scope.ticket, cut:true, openCashDrawer:true}, function(err){

            if(err)
            {
                console.log('no printer detected!: to normal printing');
                $scope.no_printer();
            }
        });

    };

    $scope.ok = function()
    {
        $modalInstance.close();
    };

    $scope.no_printer = function()
    {
        var printWindow = window.open('', 'Imprimir Ticket','height=400,width=600');
        printWindow.document.write('<html><head>');
        printWindow.document.write('</head><body ><pre>');
        printWindow.document.write($scope.ticket);
        printWindow.document.write('<pre/></body></html>');
        printWindow.document.close();
        printWindow.print();
    };

}])
.controller('TicketsReturnCtrl', ['$scope','$stateParams', '$http', '$state', function ($scope, $stateParams, $http, $state) {
    
    var oldDate, _discount;
    $scope.code = $stateParams.code;

    if(!$scope.code)
    {
        return $state.go('error');
    } 

    $scope.newTicket(function(){

        $http
        .post('/api/ticket/getByCode', {'code':$scope.code})
        .success(function (ticket) 
        {
            
            // $scope.returnTicketTotal = Math.abs(ticket.overview.total).toFixed(2);
            $scope.returnTicketTotal = ticket.overview.total;
            $scope.returnTicketTax = ticket.overview.tax;
            $scope.returnTicketDiscount = ticket.overview.discount;
            $scope.returnProducts = ticket.products;
            oldDate = ticket['date_end'];

            for(var i= 0;i<$scope.returnProducts.length;i++)
            {
                $scope.returnProducts[i]['totalQuantity'] = $scope.returnProducts[i]['quantity'];
                // You can remove next line returned to false, just there in case
                $scope.returnProducts[i]['returned'] = false;
                $scope.returnProducts[i]['_discount'] = parseFloat($scope.returnProducts[i]['discount'])/$scope.returnProducts[i]['quantity'];
            }

            ticket.overview.total = 0;
            $scope.$parent.setOldTicket(ticket,'returned');

            $scope.$parent.ticketDiscount = $scope.returnTicketDiscount;

            $scope.$parent.progress = false;

            console.log($scope.returnProducts)
        });
    });

    var calculateSub = function(i)
    {
        var quantity = $scope.returnProducts[i]['quantity'];
        var price = $scope.returnProducts[i]['price'];
        var discount = $scope.returnProducts[i]['discount'];
        var total = price * quantity;

        if(discount.indexOf('%') != -1)
        {
            discount = parseFloat(discount)/100 * price * quantity;
        }
        else
        {
            
            discount = quantity*$scope.returnProducts[i]['_discount'];
        }

        total -=  discount;

        // console.log(total.toFixed(2), parseFloat(total).toFixed(2));

        return total;
    }

    $scope.returnItem = function(i)
    {
        var subtotal, productPromise;

        if(!$scope.returnProducts[i]['returned'])//Devolvemos => aumentamos stock
        {
            //subtotal = -$scope.returnProducts[i]['subtotal'];
            productPromise = {

                '_id':$scope.returnProducts[i]['_id'],
                'quantity':-$scope.returnProducts[i]['quantity'],
                'qa':0
            };

            // console.log($scope.returnTicketDiscount, $scope.returnProducts[i]);
            // subtotal = -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
            subtotal = - calculateSub(i);

        }
        else
        {
            productPromise = {

                '_id':$scope.returnProducts[i]['_id'],
                'quantity':0,
                'qa':-$scope.returnProducts[i]['quantity']
            };

            // subtotal = ($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
            subtotal = calculateSub(i);
        }

        if($scope.returnProducts[i]['type'] == 'c')
        {
            $scope.$parent.oldTicketInfo.total += subtotal;
            $scope.$parent.applyRate();
            return;
        }

        $http
        .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
        .success(function (response) 
        {
            $scope.$parent.oldTicketInfo.total += subtotal;
            $scope.$parent.applyRate();

            for(var j=0;j<$scope.shoes['items'].length;j++)
            {
                if($scope.shoes['items'][j]['_id'] == productPromise['_id'])
                {
                    $scope.shoes['items'][j]['quantity'] += productPromise.qa - productPromise.quantity;
                }
            }
        })
        .error(function (err)
        {
            $scope.ticketNotice = {visible:true,code:3};
        });
        
    }

    $scope.decReturnQty = function(i)
    {
        var price, productPromise;

        if(!$scope.returnProducts[i]['returned'])
        {
            productPromise = {

                '_id':$scope.returnProducts[i]['_id'],
                'quantity':-($scope.returnProducts[i]['quantity']-1),
                'qa':0
            };

            if($scope.returnProducts[i]['type'] == 'c')
            {
                $scope.returnProducts[i]['quantity']--;
                // $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += -calculateSub(i);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                $scope.returnProducts[i]['subtotal'] = Math.abs($scope.$parent.oldTicketInfo.total).toFixed(2);
                return;
            }

            return $http
            .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
            .success(function (response) 
            {
                $scope.returnProducts[i]['quantity']--;
                // $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += -calculateSub(i);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                $scope.returnProducts[i]['subtotal'] = Math.abs($scope.$parent.oldTicketInfo.total).toFixed(2);

                for(var j=0;j<$scope.shoes['items'].length;j++)
                {
                    if($scope.shoes['items'][j]['_id'] == productPromise['_id'])
                    {
                        $scope.shoes['items'][j]['quantity'] += productPromise.qa - productPromise.quantity;
                    }
                }
            })
            .error(function (err)
            {
                $scope.ticketNotice = {visible:true,code:3};
            });
        }
        else
        {
            productPromise = {

                '_id':$scope.returnProducts[i]['_id'],
                'quantity':-($scope.returnProducts[i]['quantity']-1),
                'qa': -$scope.returnProducts[i]['quantity']
            };

            if($scope.returnProducts[i]['type'] == 'c')
            {
                // $scope.$parent.oldTicketInfo.total += ($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += calculateSub(i);
                $scope.returnProducts[i]['quantity']--;
                // $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += -calculateSub(i);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                $scope.returnProducts[i]['subtotal'] = Math.abs($scope.$parent.oldTicketInfo.total).toFixed(2);
                return;
            }

            return $http
            .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
            .success(function (response) 
            {
                // $scope.$parent.oldTicketInfo.total += ($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += calculateSub(i);
                $scope.returnProducts[i]['quantity']--;
                // $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += -calculateSub(i);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                $scope.returnProducts[i]['subtotal'] = Math.abs($scope.$parent.oldTicketInfo.total).toFixed(2);

                for(var j=0;j<$scope.shoes['items'].length;j++)
                {
                    if($scope.shoes['items'][j]['_id'] == productPromise['_id'])
                    {
                        $scope.shoes['items'][j]['quantity'] += productPromise.qa - productPromise.quantity;
                    }
                }
            })
            .error(function (err)
            {
                $scope.ticketNotice = {visible:true,code:3};
            });
        }
    }

    $scope.incReturnQty = function(i)
    {

        var productPromise;

        if(!$scope.returnProducts[i]['returned'])
        {
            productPromise = {

                '_id':$scope.returnProducts[i]['_id'],
                'quantity':-($scope.returnProducts[i]['quantity']+1),
                'qa':0
            };

            if($scope.returnProducts[i]['type'] == 'c')
            {
                $scope.returnProducts[i]['quantity']++;
                // $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += -calculateSub(i);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                $scope.returnProducts[i]['subtotal'] = Math.abs($scope.$parent.oldTicketInfo.total).toFixed(2);

                return;
            }

            return $http
            .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
            .success(function (response) 
            {
                $scope.returnProducts[i]['quantity']++;
                // $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += -calculateSub(i);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                $scope.returnProducts[i]['subtotal'] = Math.abs($scope.$parent.oldTicketInfo.total).toFixed(2);


                for(var j=0;j<$scope.shoes['items'].length;j++)
                {
                    if($scope.shoes['items'][j]['_id'] == productPromise['_id'])
                    {
                        $scope.shoes['items'][j]['quantity'] += productPromise.qa - productPromise.quantity;
                    }
                }
            })
            .error(function (err)
            {
                $scope.ticketNotice = {visible:true,code:3};
            });
        }
        else
        {
            productPromise = {

                '_id':$scope.returnProducts[i]['_id'],
                'quantity':-($scope.returnProducts[i]['quantity']+1),
                'qa': -$scope.returnProducts[i]['quantity']
            };

            if($scope.returnProducts[i]['type'] == 'c')
            {
                // $scope.$parent.oldTicketInfo.total += ($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += calculateSub(i);
                $scope.returnProducts[i]['quantity']++;
                // $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += -calculateSub(i);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                $scope.returnProducts[i]['subtotal'] = Math.abs($scope.$parent.oldTicketInfo.total).toFixed(2);

                return;
            }

            return $http
            .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
            .success(function (response) 
            {
                // $scope.$parent.oldTicketInfo.total += ($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += calculateSub(i);
                $scope.returnProducts[i]['quantity']++;
                // $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.oldTicketInfo.total += -calculateSub(i);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                $scope.returnProducts[i]['subtotal'] = Math.abs($scope.$parent.oldTicketInfo.total).toFixed(2);

                for(var j=0;j<$scope.shoes['items'].length;j++)
                {
                    if($scope.shoes['items'][j]['_id'] == productPromise['_id'])
                    {
                        $scope.shoes['items'][j]['quantity'] += productPromise.qa - productPromise.quantity;
                    }
                }
            })
            .error(function (err)
            {
                $scope.ticketNotice = {visible:true,code:3};
            });
        }
    }

    $scope.cancel = function()
    {
        //$window.location.href = '/tickets';
        $scope.newTicket(function(){

            $scope.$parent.progress = false;
            //$location.path("/tickets");
            //$location.path("/tickets/"+$scope.box);
            if($scope.box != '')
            {
                $state.go('tickets',{box:$scope.box});
            }
            else
            {
                $state.go('tickets');
            }
            
        });
    }

    $scope.returnTicket = function()
    {
        var products = {};

        products['date'] = oldDate;
        products['new'] = $scope.products;
        products['retained'] = [];
        products['returned'] = [];

        var mixedB = {};

        for(var i=0;i<$scope.returnProducts.length;i++)
        {
            if($scope.returnProducts[i]['returned'])
            {
                //Total items quantity is returned
                if($scope.returnProducts[i]['quantity'] == $scope.returnProducts[i]['totalQuantity'])
                {
                    products['returned'].push($scope.returnProducts[i]);
                }
                //It is returned less than total quantity
                else
                {
                    //angular.extend(mixedA,$scope.returnProducts[i]);
                    angular.extend(mixedB, $scope.returnProducts[i]);

                    mixedB.quantity = $scope.returnProducts[i].totalQuantity - $scope.returnProducts[i].quantity;

                    mixedB.returned = false;

                    mixedB.subtotal = (mixedB.quantity * $scope.returnProducts[i]['price']).toFixed(2);

                    products['returned'].push($scope.returnProducts[i]);
                    products['retained'].push(mixedB);
                }
            }
            else
            {
                products['retained'].push($scope.returnProducts[i]);
            }

            mixedB = {};
        }

        //console.log(products);

        var productsFinal = [];

        if(!products['new'].length || !products['retained'].length)
        {
            productsFinal = products['new'].concat(products['retained']);
        }
        else
        {
            var copy = {};
            
            for(var k=0; k<products['new'].length; k++)
            {
                angular.extend(copy,products['new'][k]);
                productsFinal.push(copy);
                copy = {};
            }

            //productsFinal = products['new'];

            var product_found = false;

            for(var j=0;j<products['retained'].length;j++)
            {
                product_found = false;

                for(var z=0; z<productsFinal.length; z++)
                {
                    if(products['retained'][j]['_id'] == productsFinal[z]['_id'])
                    {
                        product_found = z;
                    }
                }

                if(product_found !== false)
                {
                    productsFinal[product_found]['quantity'] += products['retained'][j]['quantity'];
                    productsFinal[product_found]['subtotal'] = (parseFloat(productsFinal[product_found]['subtotal'])+parseFloat(products['retained'][j]['subtotal'])).toFixed(2);
                }
                else
                {
                    productsFinal.push(products['retained'][j]);
                }
            }
        }

        products['productsFinal'] = productsFinal;

        return $scope.finishTicket('return',true, products); 
    }


}])
.controller('TicketsReserveCtrl', ['$scope','$stateParams', '$http', '$state', function ($scope, $stateParams, $http, $state) {
    
    $scope.code = $stateParams.code;

    if(!$scope.code)
    {
        return $state.go('error');
    } 

    $scope.newTicket(function(){

        $http
        .post('/api/ticket/getByCode', {'code':$scope.code})
        .success(function (ticket) 
        {
            $scope.savedTicketTotal = ticket.overview.total;
            $scope.savedTicketTax = ticket.overview.tax;
            $scope.savedTicketDiscount = ticket.overview.discount;
            $scope.savedProducts = ticket.products;

            $scope.$parent.setOldTicket(ticket,'booked');
            $scope.$parent.progress = false;
        });
    });

    $scope.cancel = function()
    {
        //$window.location.href = '/tickets';
        //$location.path("/tickets/"+$scope.box);
        $scope.newTicket(function(){

            $scope.$parent.progress = false;
            //$location.path("/tickets");
            //$location.path("/tickets/"+$scope.box);
            if($scope.box != '')
            {
                $state.go('tickets',{box:$scope.box});
            }
            else
            {
                $state.go('tickets');
            }
            
        });
    }

    $scope.totalAdjusted = function()
    {
        var percentage = $scope.savedTicketTotal*($scope.$parent.ticketDiscount-$scope.$parent.ticketTax)/100;

        return Math.round(($scope.savedTicketTotal-percentage)*Math.pow(10,2))/Math.pow(10,2);
    }

    $scope.saveTicket = function()
    {
        var products = [];
        
        for(var k=0;k<$scope.savedProducts.length;k++)
        {
            products.push($scope.savedProducts[k]);
        }

        if($scope['products'].length)
        {  
            var product_found = false;

            for(var i=0;i<$scope['products'].length;i++)
            {
                for(var j=0;j<products.length;j++)
                {
                    if(products[j]['_id'] == $scope['products'][i]['_id'])
                    {
                        product_found = j;
                        break;
                    }
                }

                if(product_found === false)
                {
                    products.push($scope.products[i]);
                }
                else
                {
                    products[j]['quantity'] += $scope['products'][i]['quantity'];
                    products[j]['subtotal'] = (parseFloat($scope['products'][i]['subtotal'])+parseFloat(products[j]['subtotal'])).toFixed(2);
                }

                product_found = false;
            }
        }

        return $scope.finishTicket('order',true, products);
    }

}])
/*
.controller('BoxCtrl', ['$scope', '$http', '$state', function ($scope, $http, $state) {
    

    $scope.progress = false;
    $scope.results = false;

}])
*/
;;'use strict';

/* Filters */

angular.module('kalzate.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }]);
;//'use strict';

/* Directives */


angular.module('kalzate.directives', [])
.directive('accessLevel', ['Auth', function(Auth) {
    
    return {
        restrict: 'A',
        link: function ($scope, element, attrs) {
            var prevDisp = element.css('display')
                , userRole
                , accessLevel;

                //console.log(element);
            $scope.user = Auth.user;
            $scope.$watch('user', function(user) {
                if(user.role)
                    userRole = user.role;
                updateCSS();
            }, true);

            accessLevel = Auth.accessLevels[attrs.accessLevel];
            /*
            attrs.$observe('accessLevel', function(al) {
                
                if(al) accessLevel = Auth.accessLevels[al];//$scope.$eval(al);
                updateCSS();
            });
            */
            function updateCSS() {
                if(userRole && accessLevel) 
                {
                    if(!Auth.authorize(accessLevel, userRole))
                    {
                      element.css('display', 'none');
                    } 
                    else
                    {
                      //console.log('changing to block', prevDisp);
                      element.css('display', (prevDisp == 'none' ? 'block' : prevDisp));
                    }
                        
                }
            }
        }
    };
}])
.directive('activeNav', ['$location', function($location) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var nestedA = element.find('a')[0];
            
			      if(!nestedA) return;

            var path = attrs.navSection;

            scope.location = $location;
            scope.$watch('location.path()', function(newPath) {
                if (newPath.indexOf(path) > -1) {
                    element.addClass('active');
                } else {
                    element.removeClass('active');
                }
            });
        }

    };

}])
.directive('kzSubmit', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        require: ['kzSubmit', '?form'],
        controller: ['$scope', function ($scope) {
            
            this.attempted = false;

            this.setAttempted = function() {
                this.attempted = true;
            };

            var formController = null;

            this.setFormController = function(controller) {
                formController = controller;
            };

            this.needsAttention = function (fieldModelController) {
                if (!formController) return false;

                if (fieldModelController) {
                    return fieldModelController.$invalid && 
                           (fieldModelController.$dirty || this.attempted);
                } else {
                    return formController && formController.$invalid && 
                          (formController.$dirty || this.attempted);
                }
            };
        }],
        compile: function (cElement, cAttributes, transclude) {
            return {
                pre: function(scope, formElement, attributes, controllers) 
                {
                    var submitController = controllers[0];

                    var formController = (controllers.length > 1) ? 
                                         controllers[1] : null;
                    submitController.setFormController(formController);

                    scope.kz = scope.kz || {};
                    scope.kz[attributes.name] = submitController;
                },
                post: function(scope, formElement, attributes, controllers) 
                {

                    var submitController = controllers[0];
                    var formController = (controllers.length > 1) ? 
                                         controllers[1] : null;

                    var fn = $parse(attributes.kzSubmit);

                    formElement.bind('submit', function (event) {
                        submitController.setAttempted();
                        if (!scope.$$phase) scope.$apply();

                        if (!formController.$valid) return false;
                        
                        if(scope.safeApply)
                        {
                            scope.safeApply(function() {
                                fn(scope, {$event:event});
                            });
                        }
                        else
                        {
                            scope.$apply(function() {
                                fn(scope, {$event:event});
                            });
                        }
                    });
                }
            };
        }
    }   
}])
.directive('fileDropzone', ['$compile', function($compile) {
    return {
      replace: false,
      terminal:true,
      scope: {
          uploadFileText: '@',
          uploadFileTextClass: '@',
          //fileList:'=',
          fileError: '=',
          fileLoading: '=',
          onFileChange: '&onFileChange'
      },
      //template: '<label class="{{uploadFileTextClass}}">{{uploadFileText}}</label><input type="file" style="display:none;"/>',
      //scope: true,
      link: function (scope, element, attrs) {
        
        var checkSize, isTypeValid, processDragOverOrEnter, validMimeTypes, processFile
            ,template = element.html();

        if(attrs.fileInput)
        {
          var fileId = 'filedropzone'+Math.random().toString(16);

          if(attrs.uploadFileWrapperClass) 
          {
            var wrapper = attrs.uploadFileWrapperClass.split('.');
            template = '<'+wrapper[0]+' class="'+wrapper[1]+'"><label class="{{uploadFileTextClass}}" for="'+fileId+'">{{uploadFileText}}</label><input id="'+fileId+'" type="file" style="display:none;"/></'+wrapper[0]+'>' + template;

            template = angular.element(template);

            element.children().remove();
        
            element.append(template);

            var fileLabel = angular.element(angular.element(element.children()[0]).children()[0])
                ,fileInput = angular.element(angular.element(element.children()[0]).children()[1])
                ;
          }
          else
          {
            template = '<label class="{{uploadFileTextClass}}" for="'+fileId+'">{{uploadFileText}}</label><input id="'+fileId+'" type="file" style="display:none;"/>' + template;

            template = angular.element(template);

            element.children().remove();
        
            element.append(template);

            var fileLabel = angular.element(element.children()[0])
                ,fileInput = angular.element(element.children()[1])
                ;
          }

          var resetFileInput = function () {

              fileInput.unbind('click');
              fileInput.remove();

              fileId = 'filedropzone'+Math.random().toString(16);
              
              fileInput = angular.element(document.createElement("input"));
              fileInput.attr('type', 'file');
              fileInput.attr('id', fileId);
              fileInput.css('display', 'none');
              fileInput.bind('change', function (e) {
                processFile(e,true);
              });

              fileLabel.after(fileInput);
              fileLabel.attr("for", fileId);
          };

          fileInput.bind('change', function (e) {
              processFile(e,true);
          });

        }
        else
        {
          template = '<label class="{{uploadFileTextClass}}">{{uploadFileText}}</label>' + template;

          template = angular.element(template);

          element.children().remove();
        
          element.append(template);
          
        }

        if(!attrs.uploadFileText) 
        {
            attrs.uploadFileText = 'ARRASTRA TUS FICHEROS AQUÍ';
        }

        if(!attrs.uploadFileTextClass) 
        {
            attrs.uploadFileTextClass = 'dropzone-label';
        }

        $compile(template)(scope);

        processDragOverOrEnter = function (event) 
        {         
          if (event) 
          {
            event.preventDefault();
          }

          event.dataTransfer.effectAllowed = 'copy';
          return false;
        };

        validMimeTypes = attrs.fileDropzone;

        checkSize = function (size) 
        {
          var _ref;

          if (((_ref = attrs.maxFileSize) === (void 0) || _ref === '') || (size / 1024) / 1024 < attrs.maxFileSize) 
          {
            return true;
          } 
          else 
          {
            
            scope.$apply(function () 
            {
                //scope.fileError = 'size';
                //scope.fileError = 1;
                scope.fileLoading = false;
                scope.fileError['code']= 1;
                scope.fileError['visible']= true;
                //toFn(scope);
            });

            return false;
          }

        };

        isTypeValid = function(type) 
        {

          //Temporal solution for those cases when the browser set no mime type on file
          if(type == '')
          {
            return true;
          }

          if(((validMimeTypes === (void 0) || validMimeTypes === '') 
            || !type 
            || validMimeTypes.indexOf(type) > -1)
            && type.replace(/\ /g,'') != '') 
          {
            return true;
          } 
          else 
          {
            
            scope.$apply(function () 
            {
                //scope.fileError = 'mime';
                scope.fileLoading = false;
                scope.fileError['code']= 2;
                scope.fileError['visible']= true;
                //toFn(scope);
            });

            return false;
          }
        };

        processFile = function(event, input)
        {
            scope.fileLoading = true;

            var file, name, reader, size, type;

            if (event) 
            {
                event.preventDefault();
            }

            file = (input) ? fileInput[0].files[0] : event.dataTransfer.files[0];
            name = file.name;
            type = file.type;
            size = file.size;

            reader = new FileReader();

            reader.onload = function(evt) 
            {
              
              if (checkSize(size) && isTypeValid(type)) 
              {

                var file = {};

                file['data'] = evt.target.result;
                file['name'] = name;
                file['size'] = size;
                file['type'] = type;

                if(input)
                {
                  resetFileInput();
                }

                return scope.$apply(function () 
                {
                  //scope.fileError = false;
                  scope.fileError['visible']= false;

                  scope.onFileChange({file:file});

                  scope.fileLoading = false;

                });
              }

            };

            if(attrs.readFileAs == 'text')
            {
              reader.readAsText(file);
            }
            else
            {
              reader.readAsDataURL(file);
            }

            return false;
        };

        var container = element.parent().parent().parent().parent().parent();

        container.bind('drop', function(e){
          event.preventDefault();
        });

        container.bind('dragover', function(e){
          event.preventDefault();
        });

        container.bind('dragenter', function(e){
          event.preventDefault();
        });

        element.bind('dragover', processDragOverOrEnter);

        element.bind('dragenter', processDragOverOrEnter);

        element.bind('drop', function (event) {
          
            processFile(event,false);
        });
      }
    };
}])
.directive('jsonTable', [function() {
    
    return {

      restrict: 'A',
      replace: true,
      scope: 
      {
          jsonTable: '@' ,
          jsonTableData: '=',
          jsonTableLoaded: '=',
          jsonTableActive: '='
      },
      link:  function(scope, elem, attrs) 
      {

        var json2table = function (json) 
        {

            var createTR = function (id) 
            {
               var tr = document.createElement("tr");
               tr.ID = id;
               return tr;
            },

            createTH = function (html) 
            {
               var th = document.createElement("th");
               th.className = "text-center";
               th.innerHTML = html.charAt(0).toUpperCase() + html.slice(1).toLowerCase();
               return th;
            },

            createTD = function (html) 
            {
               var td = document.createElement("td");
               //var input = document.createElement('input');
               //input.className = "text-center inline-editing-inactive";
               //var attr = document.createAttribute("value");
                //attr.nodeValue = html;
                //input.setAttributeNode(attr);
               //var attr = document.createAttribute("type");
                //attr.nodeValue = "text";
                //input.setAttributeNode(attr);
               //var attr = document.createAttribute("inline-edit");
                //input.setAttributeNode(attr);
               //td.innerHTML = input.outerHTML;
               td.innerHTML = html;
               return td;
            },
            pTable,
            headerCount = new Object()
            ;

            if (json.length > 0) 
            {

              var index = 0,
              pTableHead = document.createElement("thead"),
              pTableBody = document.createElement("tbody"),
              head = createTR();

              pTable = document.createElement("table");
              pTable.className = "table text-center";

              head.appendChild(createTH('Nº'));

              for (var item in json[0]) 
              {
                 if (!headerCount.hasOwnProperty(item)) 
                 {
                     head.appendChild(createTH(item));
                     headerCount[item] = index;
                     index++;
                 }
              }
                   
              pTableHead.appendChild(head);
              pTable.appendChild(pTableHead);

              for (var i = 0; i < json.length; i++) 
              {
                var row = new createTR(i);

                row.appendChild(createTD(i+1));

                for (j in json[i]) 
                {
                    row.appendChild(createTD(json[i][j]));
                }

                pTableBody.appendChild(row);
              }

              pTable.appendChild(pTableBody);
            }
           
           return pTable;
        }

        scope.$watch('jsonTable', function(value) {
          
          if(scope.jsonTableActive)
          {
            console.log('renderinf Table');scope.jsonTableLoaded = true;
            elem.append(json2table(scope.jsonTableData[parseInt(value)]['data']));
            scope.jsonTableLoaded = false;
          }

        });

        scope.$watch('jsonTableActive', function(value) {
          
            if(value)
            {
              console.log('renderinf Active');scope.jsonTableLoaded = true;
              elem.append(json2table(scope.jsonTableData[parseInt(scope.jsonTable)]['data']));
              scope.jsonTableLoaded = false;
            }
            

        });

        /*scope.$watch('asyncHtml', function(value) {
          
          //console.log(value);
          scope.asyncLoaded = true;
        
          var temp = document.createElement('div'),
              frag = document.createDocumentFragment();

          //console.log(attrs.asyncHtml);

          temp.innerHTML = value;

          (function(){

            if(temp.firstChild)
            {
                frag.appendChild(temp.firstChild);
                setTimeout(arguments.callee, 0);
            } 
            else 
            {
                scope.$apply(function(){

                       elem.append(frag);
                       scope.asyncLoaded = false;
                });

                //elem.append(frag);
            }

          })();

        });*/
        
      }

    };
}])
.directive('imgLoad', [function() {
    
    return {
      scope: 
      {
          imgLoad: '=' ,
          imgLoadError: '&imgLoadError',
          imgLoadSuccess: '&imgLoadSuccess'
      },
      link:  function(scope, elem, attrs) 
      {

          var index = 0;

          elem.bind('error', function(){

              scope.$apply(function(){

                  scope.imgLoadError({index:index});
              });

              index++;
          });

          elem.bind('load', function(){

              elem.unbind('load');
              elem.unbind('error');

              scope.$apply(function(){

                  scope.imgLoadSuccess();
              });
          });

          scope.$watch('imgLoad', function(value){

            elem.attr('src', value);

          });

      }
    };
}])
.directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
}]);
;angular.module('kalzate').run(['$templateCache', function($templateCache) {

  $templateCache.put('/static/partials/404.html',
    "<p>Página no encontrada</p>"
  );


  $templateCache.put('/static/partials/home.html',
    "<div style=width:248px;margin:auto;height:204px;position:absolute;top:50%;left:50%;margin-top:-102px;margin-left:-124px><img src=/static/img/construction.png></div>"
  );


  $templateCache.put('/static/partials/login.html',
    "<div id=signin class=container ng-controller=LoginCtrl><div class=\"panel panel-default panel-signin\"><div class=panel-body><form kz-submit=login() name=loginForm novalidate><h2 class=form-signin-heading>¡Inicia Sesión!</h2><div ng-class=\"{'has-error': kz.loginForm.needsAttention(loginForm.username)}\"><input type=email placeholder=Emplead@ class=form-control ng-model=username name=username typeahead=\"item for item in ['ana.de.la.rosa.villalobos@gmail.com','canciondiferente@hotmail.com'] | filter:$viewValue | limitTo:1\" autocomplete=off required></div><div ng-class=\"{'has-error': kz.loginForm.needsAttention(loginForm.password)}\"><input type=password placeholder=Contraseña class=form-control pattern=.{8,} ng-model=password name=password ng-minlength=8 required></div><input type=submit class=\"btn btn-lg btn-primary btn-block\" value=Acceder><small class=text-primary><a ui-sref=recover>¿Has olvidado tu contraseña?</a> | <a ui-sref=register>Crea una cuenta</a></small></form><div ng-show=error class=\"alert alert-danger\"><p class=text-center><strong>Hmmm...¡No te conozco!</strong></p></div></div></div></div>"
  );


  $templateCache.put('/static/partials/recover.html',
    "<div id=signin class=container><div class=\"panel panel-default panel-signin\"><div class=panel-body><form name=recoverForm kz-submit=recover() novalidate><h2 class=form-signin-heading>¡Recupera tu Contraseña!</h2><div style=\"margin:10px auto\" ng-class=\"{'has-error': kz.recoverForm.needsAttention(recoverForm.email)}\"><input type=email placeholder=Email class=form-control ng-model=email name=email required></div><input type=submit class=\"btn btn-lg btn-primary btn-block\" value=\"Enviar Contraseña\"></form><div ng-show=serverNotice.visible class=\"alert alert-danger\" ng-switch=serverNotice.code><p class=text-center ng-switch-when=0><strong>¡Hemos enviado una nueva contraseña a su correo electrónico! Pulsa <a ui-sref=login>aquí</a> para ingresar al sistema</strong></p><p class=text-center ng-switch-when=1><strong>¡Esta cuenta no existe!</strong></p></div></div></div></div>"
  );


  $templateCache.put('/static/partials/register.html',
    "<div id=signin class=container ng-controller=RegisterCtrl><div class=\"panel panel-default panel-signin\"><div class=panel-body><form name=registerForm kz-submit=register() novalidate><h2 class=form-signin-heading>¡Crea una Cuenta!</h2><div ng-class=\"{'has-error': kz.registerForm.needsAttention(registerForm.email)}\"><input type=email placeholder=Email class=form-control ng-model=email name=email required></div><div ng-class=\"{'has-error': kz.registerForm.needsAttention(registerForm.password)}\"><input type=password placeholder=Contraseña class=form-control pattern=.{8,} ng-model=password name=password ng-minlength=8 required></div><div class=form-group><input placeholder=\"Nombre Usuario\" class=form-control ng-model=username name=username></div><input type=submit class=\"btn btn-lg btn-primary btn-block\" value=Acceder></form><div ng-show=serverError class=\"alert alert-danger\"><p class=text-center><strong>¡Esta cuenta ya existe! Pulsa <a ui-sref=recover>aquí</a> si olvidaste tu contraseña</strong></p></div></div></div></div>"
  );


  $templateCache.put('/static/partials/shoe_edit.html',
    "<div class=container><div class=\"panel panel-default panel-custom\"><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Modificar Zapato</h3><div class=\"btn-group pull-right\"><a ui-sref=shoes class=\"btn btn-default\"><span class=\"glyphicon glyphicon-remove-circle\"></span></a> <button data-ng-click=submit() class=\"btn btn-default\"><span class=\"glyphicon glyphicon-ok-circle\"></span></button></div></div><div class=panel-body><p ng-show=initProgress class=text-center>Espere por favor &hellip;</p><div ng-show=initProgress class=\"progress progress-striped active\"><div class=progress-bar style=\"width: 100%\"></div></div><form kz-submit=edit() id=shoes-edit-form class=shoes-form name=shoeEditForm ng-show=!initProgress novalidate><div ng-switch=imagesError.code ng-show=imagesError.visible class=\"alert alert-danger\"><p ng-switch-when=1 class=text-center>La foto tiene más de 3 MBytes</p><p ng-switch-when=2 class=text-center>El fichero está corrupto o no tiene un formato de imagen válido (png, jpeg o gif)</p><p ng-switch-when=3 class=text-center>No hemos podido guardar la foto</p><p ng-switch-default=\"\" class=text-center>{{imagesError.msg}}</p></div><div data-file-dropzone=\"[image/png, image/jpg, image/jpeg, image/gif]\" data-max-file-size=2 data-on-file-change=newFile(file) data-file-input=true data-upload-file-text=\"ARRASTRA TUS FOTOS AQUÍ\" data-file-error=imagesError data-file-loading=progress data-upload-file-wrapper-class=div.col-lg-12 data-read-file-as=data class=\"row first-row\"><div class=\"col-sm-6 col-md-3\" style=margin-top:20px ng-repeat=\"img in $parent.images\"><a href=# class=thumbnail><img src={{img.data}} alt={{img.name}}></a><p class=text-center><span>{{img.name}}</span><span ng-click=$parent.$parent.closeImg($index) style=margin-left:10px;font-size:20px;cursor:pointer>&times;</span></p></div></div><div ng-show=progress class=\"progress progress-striped active\"><div class=progress-bar style=\"width: 100%\"></div></div><div class=row><div class=col-lg-3><label>Referencia (*)</label><div ng-class=\"{'has-error': kz.shoeEditForm.needsAttention(shoeEditForm.reference)}\"><input class=form-control ng-model=reference placeholder=Referencia name=reference ng-pattern=/^[0-9A-Za-z\\-\\_]{3,}$/ required></div><span class=help-block>Identificador único. Puede utilizar su lector de código de barras.</span></div><div class=col-lg-3><label>Marca (*)</label><div ng-class=\"{'has-error': kz.shoeEditForm.needsAttention(shoeEditForm.brand)}\"><input class=form-control ng-model=brand placeholder=Modelo name=brand required></div><span class=help-block>El modelo de fábrica del producto</span></div><div class=col-lg-3><label>Precio (*)</label><div class=input-group ng-class=\"{'has-error': kz.shoeEditForm.needsAttention(shoeEditForm.price)}\"><input type=number class=form-control placeholder=Precio min=0 ng-model=price name=price step=0.1 required></div><span class=help-block>Por defecto se utilizan euros.</span></div><div class=col-lg-3><label>Cantidad (*)</label><div ng-class=\"{'has-error': kz.shoeEditForm.needsAttention(shoeEditForm.quantity)}\"><input type=number class=form-control placeholder=Cantidad min=1 ng-model=quantity name=quantity ng-minlength=1 required></div><span class=help-block>Indique el número de artículos que dispone para este producto</span></div></div><div class=row><div class=col-lg-3><label>Talla (*)</label><div ng-class=\"{'has-error': kz.shoeEditForm.needsAttention(shoeEditForm.size)}\"><input type=number class=form-control ng-model=size name=size placeholder=Talla min=18 max=45 required></div><span class=help-block>Tamaño o talla del producto</span></div><div class=col-lg-3><label>Color (*)</label><div ng-class=\"{'has-error': kz.shoeEditForm.needsAttention(shoeEditForm.color)}\"><input class=form-control ng-model=color name=color typeahead=\"item as item.color for item in colors | filter:$viewValue | limitTo:8\" autocomplete=off typeahead-template-url=searchAutocompleteTpl.html placeholder=Color required></div><span class=help-block>El color del producto</span></div><div class=col-lg-3><label>Categoría</label><div><select class=form-control data-ng-model=category ng-options=\"v for v in ['HOMBRES','MUJERES','NIÑOS']\"></select></div><span class=help-block>Grupo o categoría a la que pertence el producto</span></div><div class=col-lg-3><label>Temporada</label><div><select class=form-control data-ng-model=season ng-options=\"v for v in ['VERANO','INVIERNO']\"></select></div><span class=help-block>Indique si pertenece a la temporada verano o invierno</span></div></div><div class=row><div class=col-lg-3><label>Fabricante</label><input class=form-control data-ng-model=maker placeholder=Fabricante><span class=help-block>Fabricante del producto</span></div><div class=col-lg-3><label>Proveedor</label><input class=form-control ng-model=provider placeholder=Proveedor><span class=help-block>Proveedor del producto</span></div><div class=col-lg-3><label>Palabras Clave</label><input class=form-control ng-model=keywords placeholder=Keywords><span class=help-block>Indique palabras separadas por coma que hagan referencia al producto. Ej: piel, seminuevo, ganga</span></div><div class=col-lg-3><label>Ubicación</label><input class=form-control ng-model=location placeholder=Ubicación><span class=help-block>Indique el número de la estantería dentro del almacen donde se localiza el producto</span></div></div><div class=row><div class=col-lg-6><label>Descripción</label><textarea class=form-control ng-model=description rows=3></textarea><span class=help-block>Descripción del producto</span></div><div class=col-lg-6><label>Comentarios</label><textarea class=form-control ng-model=comments rows=3></textarea><span class=help-block>Comentarios del producto</span></div></div></form></div><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Modificar Zapato</h3><div class=\"btn-group pull-right\"><a ui-sref=shoes class=\"btn btn-default\"><span class=\"glyphicon glyphicon-remove-circle\"></span></a> <button data-ng-click=create() class=\"btn btn-default\"><span class=\"glyphicon glyphicon-ok-circle\"></span></button></div></div></div></div>"
  );


  $templateCache.put('/static/partials/shoe_new.html',
    "<div class=container><div class=\"panel panel-default panel-custom\"><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Añadir Nuevo Zapato</h3><div class=\"btn-group pull-right\"><a ui-sref=shoes class=\"btn btn-default\"><span class=\"glyphicon glyphicon-remove-circle\"></span></a> <button data-ng-click=submit() class=\"btn btn-default\"><span class=\"glyphicon glyphicon-ok-circle\"></span></button></div></div><div class=panel-body><form kz-submit=create() id=stock-add-form class=shoes-form name=shoeAddForm novalidate><div ng-switch=imagesError.code ng-show=imagesError.visible class=\"alert alert-danger\" style=\"margin: 30px\"><p ng-switch-when=1 class=text-center>La foto tiene más de 3 MBytes</p><p ng-switch-when=2 class=text-center>El fichero está corrupto o no tiene un formato de imagen válido (png, jpeg o gif)</p><p ng-switch-when=3 class=text-center>No hemos podido guardar la foto</p><p ng-switch-when=4 class=text-center>¡Este zapato ya se encuentra en el almacen!</p><p ng-switch-default=\"\" class=text-center>{{imagesError.msg}}</p></div><div data-file-dropzone=\"[image/png, image/jpg, image/jpeg, image/gif]\" data-max-file-size=2 data-on-file-change=newFile(file) data-file-input=true data-upload-file-text=\"ARRASTRA TUS FOTOS AQUÍ\" data-file-error=imagesError data-file-loading=progress data-upload-file-wrapper-class=div.col-lg-12 data-read-file-as=data class=\"row first-row\"><div class=\"col-sm-6 col-md-3\" style=margin-top:20px ng-repeat=\"img in $parent.images\"><a href=# class=thumbnail><img src={{img.data}} alt={{img.name}}></a><p class=text-center><span>{{img.name}}</span><span ng-click=$parent.$parent.closeImg($index) style=margin-left:10px;font-size:20px;cursor:pointer>&times;</span></p></div></div><div ng-show=progress class=\"progress progress-striped active\"><div class=progress-bar style=\"width: 100%\"></div></div><div class=row><div class=col-lg-3><label>Referencia (*)</label><div ng-class=\"{'has-error': kz.shoeAddForm.needsAttention(shoeAddForm.reference)}\"><input class=form-control ng-model=reference placeholder=Referencia name=reference ng-pattern=/^[0-9A-Za-z\\-\\_]{3,}$/ required></div><span class=help-block>Identificador único. Puede utilizar su lector de código de barras.</span></div><div class=col-lg-3><label>Marca (*)</label><div ng-class=\"{'has-error': kz.shoeAddForm.needsAttention(shoeAddForm.brand)}\"><input class=form-control ng-model=brand placeholder=Modelo name=brand required></div><span class=help-block>El modelo de fábrica del producto</span></div><div class=col-lg-3><label>Precio (*)</label><div class=input-group ng-class=\"{'has-error': kz.shoeAddForm.needsAttention(shoeAddForm.price)}\"><input type=number class=form-control placeholder=Precio min=0 ng-model=price name=price step=0.1 required></div><span class=help-block>Por defecto se utilizan euros.</span></div><div class=col-lg-3><label>Cantidad (*)</label><div ng-class=\"{'has-error': kz.shoeAddForm.needsAttention(shoeAddForm.quantity)}\"><input type=number class=form-control placeholder=Cantidad min=1 ng-model=quantity name=quantity ng-minlength=1 required></div><span class=help-block>Indique el número de artículos que dispone para este producto</span></div></div><div class=row><div class=col-lg-3><label>Talla (*)</label><div ng-class=\"{'has-error': kz.shoeAddForm.needsAttention(shoeAddForm.size)}\"><input type=number class=form-control ng-model=size name=size placeholder=Talla min=9 max=49 required></div><span class=help-block>Tamaño o talla del producto</span></div><div class=col-lg-3><label>Color (*)</label><div ng-class=\"{'has-error': kz.shoeAddForm.needsAttention(shoeAddForm.color)}\"><input class=form-control ng-model=color name=color typeahead=\"item as item.color for item in colors | filter:$viewValue | limitTo:8\" autocomplete=off typeahead-template-url=searchAutocompleteTpl.html placeholder=Color required></div><span class=help-block>El color del producto</span></div><div class=col-lg-3><label>Categoría</label><div><select class=form-control data-ng-model=category ng-options=\"v for v in ['HOMBRES','MUJERES','NIÑOS']\"></select></div><span class=help-block>Grupo o categoría a la que pertence el producto</span></div><div class=col-lg-3><label>Temporada</label><div><select class=form-control data-ng-model=season ng-options=\"v for v in ['VERANO','INVIERNO']\"></select></div><span class=help-block>Indique si pertenece a la temporada verano o invierno</span></div></div><div class=row><div class=col-lg-3><label>Fabricante</label><input class=form-control ng-model=maker placeholder=Fabricante><span class=help-block>Fabricante del producto</span></div><div class=col-lg-3><label>Proveedor</label><input class=form-control ng-model=provider placeholder=Proveedor><span class=help-block>Proveedor del producto</span></div><div class=col-lg-3><label>Palabras Clave</label><input class=form-control ng-model=keywords placeholder=Keywords><span class=help-block>Indique palabras separadas por coma que hagan referencia al producto. Ej: piel, seminuevo, ganga</span></div><div class=col-lg-3><label>Ubicación</label><input class=form-control ng-model=location placeholder=Ubicación><span class=help-block>Indique el número de la estantería dentro del almacen donde se localiza el producto</span></div></div><div class=row><div class=col-lg-6><label>Descripción</label><textarea class=form-control ng-model=description rows=3></textarea><span class=help-block>Descripción del producto</span></div><div class=col-lg-6><label>Comentarios</label><textarea class=form-control ng-model=comments rows=3></textarea><span class=help-block>Comentarios del producto</span></div></div></form></div><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Añadir Nuevo Zapato</h3><div class=\"btn-group pull-right\"><a ui-sref=shoes class=\"btn btn-default\"><span class=\"glyphicon glyphicon-remove-circle\"></span></a> <button data-ng-click=create() class=\"btn btn-default\"><span class=\"glyphicon glyphicon-ok-circle\"></span></button></div></div></div></div>"
  );


  $templateCache.put('/static/partials/shoe_onemore.html',
    "<div class=table-responsive><form kz-submit=addShoe() name=shoeForm novalidate><table class=\"table text-center\" style=margin-bottom:0><tbody><tr style=\"border-bottom:1px dotted #CAC5C5\"><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.shoeForm.needsAttention(shoeForm.reference)}\"><input class=form-control ng-model=reference name=reference placeholder=Referencia ng-pattern=/^[0-9A-Za-z\\-\\_]{3,}$/ required></div></td><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.shoeForm.needsAttention(shoeForm.brand)}\"><input class=form-control ng-model=brand name=brand placeholder=Marca required></div></td><td class=active><div class=input-group-sm><select class=form-control data-ng-model=category ng-options=\"v for v in ['HOMBRES','MUJERES','NIÑOS']\"></select></div></td><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.shoeForm.needsAttention(shoeForm.color)}\"><input class=form-control ng-model=color name=color typeahead=\"item as item.color for item in colors | filter:$viewValue | limitTo:8\" autocomplete=off typeahead-template-url=searchAutocompleteTpl.html placeholder=Color required></div></td><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.shoeForm.needsAttention(shoeForm.size)}\"><input type=number class=\"form-control btn-sm\" ng-model=size name=size placeholder=Talla min=9 max=49 required></div></td><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.shoeForm.needsAttention(shoeForm.price)}\"><input type=number step=0.10 class=\"form-control btn-sm\" placeholder=Precio ng-model=price min=0 name=price pattern=[0-9]+(\\\\.[0-9][0-9]?)? required></div></td><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.shoeForm.needsAttention(shoeForm.quantity)}\"><input type=number class=\"form-control btn-sm\" placeholder=Cantidad min=1 ng-model=quantity name=quantity ng-minlength=1 required></div></td><td class=active><button class=\"btn btn-default btn-sm\" type=button data-ng-click=reset()><span class=\"glyphicon glyphicon-trash\"></span></button></td><td class=active><input type=submit class=\"btn btn-primary btn-sm\" value=Guardar></td></tr></tbody></table></form></div>"
  );


  $templateCache.put('/static/partials/shoe_search.html',
    "<div class=table-responsive><table class=\"table text-center\" style=margin-bottom:0><tbody><tr style=\"border-bottom:1px dotted #CAC5C5\"><td class=active><div class=input-group-sm><input class=form-control ng-model=$parent.query.brand typeahead=\"item for item in brands | filter:$viewValue | limitTo:10\" autocomplete=off placeholder=Marca data-ng-disabled=\"pagination.totalItems < 1 && !searching\" typeahead-on-select=pagination.search() data-ng-change=\"updateSearch('brand')\"></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=$parent.query.color typeahead=\"item as item.color for item in colors | filter:$viewValue | limitTo:8\" autocomplete=off typeahead-template-url=searchAutocompleteTpl.html placeholder=Color data-ng-change=pagination.search() typeahead-on-select=pagination.search()></div></td><td class=active><div class=input-group-sm><input type=number class=form-control ng-model=$parent.query.size data-ng-change=pagination.search() placeholder=Talla min=18 max=45 required></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=$parent.query.category typeahead=\"item for item in ['HOMBRES','MUJERES','NIÑOS'] | filter:$viewValue \" autocomplete=off placeholder=Categoría data-ng-change=\"updateSearch('category')\" typeahead-on-select=pagination.search()></div></td></tr></tbody></table></div>"
  );


  $templateCache.put('/static/partials/shoes.html',
    "<div class=container><div class=\"panel panel-default panel-custom\"><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Stock de Zapatos</h3><div class=\"btn-group pull-right\"><a ui-sref=newShoe class=\"btn btn-default\">Añadir Nuevo</a> <a ui-sref=shoes.onemore class=\"btn btn-default\"><span class=\"glyphicon glyphicon-plus\"></span></a></div></div><div class=\"panel-heading clearfix\"><div class=pull-left><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Mostrar</span><select class=form-control data-ng-model=pagination.itemsPerPage ng-options=\"v for v in [10,20,40,80]\" data-ng-click=pagination.setItemsPerPage() data-ng-disabled=\"pagination.totalItems < 1\" style=width:70px></select></div><div class=\"btn-group pull-left\"><script type=text/ng-template id=ModalImportShoes.html><div class=\"modal-content\">\n" +
    "                    <div class=\"modal-header\">\n" +
    "                      <button type=\"button\" class=\"close\" ng-click=\"cancel()\">&times;</button>\n" +
    "                      <h4 class=\"modal-title\">Importar Zapatos</h4>\n" +
    "                    </div>\n" +
    "                    <div class=\"modal-body\">\n" +
    "                      <div data-file-dropzone=\"['text/csv', 'text/plain']\" data-max-file-size=\"3\" data-on-file-change=\"newFile(file)\" data-file-input=\"true\" data-upload-file-text=\"Arrastra tus ficheros CSV aquí &hellip;\" data-file-error=\"fileError\" data-file-loading=\"progress\" data-read-file-as=\"text\" style=\"margin-top:20px\">\n" +
    "                      </div>\n" +
    "                       <div ng-switch=\"fileError.code\" ng-show=\"fileError.visible\" class=\"alert alert-danger\" style=\"margin-top:10px;\">\n" +
    "                        <p ng-switch-when=\"1\" class=\"text-center\">El fichero supera los 3 MBytes</p>\n" +
    "                        <p ng-switch-when=\"2\" class=\"text-center\">¡Selecciona un fichero CSV!</p>\n" +
    "                        <p ng-switch-when=\"3\" class=\"text-center\">¡Algunos datos estan duplicados o estan mal formateados!</p>\n" +
    "                        <p ng-switch-default class=\"text-center\">{{fileError.msg}}</p>\n" +
    "                      </div>\n" +
    "                      <div ng-show=\"progress\" class=\"progress progress-striped active\">\n" +
    "                        <div class=\"progress-bar\" style=\"width: 100%\">\n" +
    "                        </div>\n" +
    "                      </div>\n" +
    "                      <div ng-show=\"files.length > 0\" style=\"margin-top:20px;\">\n" +
    "                        <div class=\"input-group\" style=\"width:350px;margin:auto;\">\n" +
    "                          <span class=\"input-group-addon\">\n" +
    "                            <input type=\"checkbox\" ng-model=\"$parent.remove\" >\n" +
    "                          </span>\n" +
    "                          <p class=\"form-control text-center\">Borrar todos los zapatos antiguos</p>\n" +
    "                        </div>\n" +
    "                      </div>\n" +
    "                      <div ng-show=\"displayCSV\" style=\"margin-top:20px;\">\n" +
    "                        <tabset>\n" +
    "                          <tab ng-repeat=\"file in files\" active=\"tab.active\" disabled=\"tab.disabled\">\n" +
    "                            <tab-heading>{{file.name}}<span class=\"close\" style=\"margin-left:15px;\" ng-click=\"closeTab($index)\">&times;</span></tab-heading>\n" +
    "                            <div json-table=\"{{$index}}\" json-table-data=\"$parent.files\" json-table-loaded=\"$parent.progress\" json-table-active=\"$parent.displayCSV\" style=\"overflow:auto;height:220px;\"></div>\n" +
    "                          </tab>\n" +
    "                        </tabset>\n" +
    "                      </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"modal-footer\">\n" +
    "                      <button type=\"button\" class=\"btn btn-default\" ng-click=\"cancel()\">Cancelar</button>\n" +
    "                      <button type=\"button\" class=\"btn btn-info\" ng-show=\"files.length > 0 && !displayCSV\" ng-click=\"display()\">Ver</button>\n" +
    "                      <button type=\"button\" class=\"btn btn-primary\" ng-show=\"files.length > 0\" ng-click=\"ok()\">Importar Zapatos</button>\n" +
    "                    </div>\n" +
    "                  </div><!-- /.modal-content --></script><script type=text/ng-template id=ModalQRShoes.html><div class=\"modal-content\">\n" +
    "                    <div class=\"modal-header\">\n" +
    "                      <h4 class=\"modal-title\">Código QR</h4>\n" +
    "                    </div>\n" +
    "                    <div class=\"modal-body\">\n" +
    "                      <p ng-show=\"progress\" class=\"text-center\">Espere por favor &hellip;</p>\n" +
    "                      <div ng-show=\"progress\" class=\"progress progress-striped active\">  \n" +
    "                        <div class=\"progress-bar\" style=\"width: 100%\"></div>\n" +
    "                      </div>\n" +
    "                      <p ng-show=\"!progress && !error\">Ahora puedes imprimir o copiar su código QR y comenzar a leerlo con su lector QR preferido</p>\n" +
    "                      <div ng-show=\"error\" class=\"alert alert-danger\" style=\"margin-top:10px;\">\n" +
    "                        <p class=\"text-center\">Ha ocurrido un error mientras obteníamos el código QR. ¡Ya hemos avisado a Zuri!</p>\n" +
    "                      </div>\n" +
    "                      <div class=\"text-center\"><img ng-show=\"!progress && !error\" src=\"{{qr}}\"/></div>\n" +
    "                    </div>\n" +
    "                    <div class=\"modal-footer\">\n" +
    "                      <button type=\"button\" class=\"btn btn-info\" ng-show=\"!progress && !error\" ng-click=\"print()\">Imprimir</button>\n" +
    "                      <button type=\"button\" class=\"btn btn-info\" ng-show=\"!progress\" ng-click=\"ok()\">Salir</button>\n" +
    "                    </div>\n" +
    "                  </div><!-- /.modal-content --></script><script type=text/ng-template id=ModalBCShoes.html><div class=\"modal-content\">\n" +
    "                    <div class=\"modal-header\">\n" +
    "                      <h4 class=\"modal-title\">Código de Barras</h4>\n" +
    "                    </div>\n" +
    "                    <div class=\"modal-body\">\n" +
    "                      <p ng-show=\"progress\" class=\"text-center\">Espere por favor &hellip;</p>\n" +
    "                      <div ng-show=\"progress\" class=\"progress progress-striped active\">  \n" +
    "                        <div class=\"progress-bar\" style=\"width: 100%\"></div>\n" +
    "                      </div>\n" +
    "                      <p ng-show=\"!progress && !error\" style=\"margin-bottom:30px;\">Ahora puedes imprimir o copiar el código de barras que se muestra a continuación. Nota: El código de barras sigue el modelo <stron>Code 128</strong>.</p>\n" +
    "                      <div ng-show=\"error\" class=\"alert alert-danger\" style=\"margin-top:10px;\">\n" +
    "                        <p class=\"text-center\">Ha ocurrido un error mientras obteníamos el código de barras. ¡Ya hemos avisado a Zuri!</p>\n" +
    "                      </div>\n" +
    "                      <div class=\"text-center\">\n" +
    "                        <img img-load=\"barcode\" img-load-error=\"onError(index)\" img-load-success=\"progress = false\" ng-show=\"!progress && !error\" />\n" +
    "                      </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"modal-footer\">\n" +
    "                      <button type=\"button\" class=\"btn btn-info\" ng-show=\"!progress && !error\" ng-click=\"print()\">Imprimir</button>\n" +
    "                      <button type=\"button\" class=\"btn btn-info\" ng-show=\"!progress\" ng-click=\"ok()\">Salir</button>\n" +
    "                    </div>\n" +
    "                  </div><!-- /.modal-content --></script><script type=text/ng-template id=ModalPrintShoes.html><div class=\"modal-content\">\n" +
    "                    <div class=\"modal-header\">\n" +
    "                      <h4 class=\"modal-title\">Impresión Códigos de Barras</h4>\n" +
    "                    </div>\n" +
    "                    <div class=\"modal-body\">\n" +
    "                      <p ng-show=\"progress\" class=\"text-center\">Espere por favor &hellip;</p>\n" +
    "                      <div ng-show=\"progress\" class=\"progress progress-striped active\">  \n" +
    "                        <div class=\"progress-bar\" style=\"width: 100%\"></div>\n" +
    "                      </div>\n" +
    "                      <p ng-show=\"!progress && !error\" style=\"margin-bottom:30px;\">Ya puedes descargar una copia con todos los códigos de barra de tus zapatos e imprimirla. Nota: El documento generado está en formato pdf, con estilo de página A4.</p>\n" +
    "                      <div ng-show=\"error\" class=\"alert alert-danger\" style=\"margin-top:10px;\">\n" +
    "                        <p class=\"text-center\">Ha ocurrido un error mientras obteníamos el código de barras. ¡Ya hemos avisado a Zuri!</p>\n" +
    "                      </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"modal-footer\">\n" +
    "                      <a class=\"btn btn-info\" ng-show=\"!progress && !error\" ng-href=\"{{pdf}}\" download=\"zapatos_barcodes.pdf\" target=\"_self\">Descargar</a>\n" +
    "                      <button type=\"button\" class=\"btn btn-info\" ng-show=\"!progress\" ng-click=\"ok()\">Salir</button>\n" +
    "                    </div>\n" +
    "                  </div><!-- /.modal-content --></script><div class=btn-group><a class=\"btn btn-default btn-sm\" ng-click=openPrint() data-ng-disabled=\"pagination.totalItems < 1\"><span class=\"glyphicon glyphicon-print\"></span></a> <button type=button class=\"btn btn-default btn-sm\" ng-click=openImport()>Importar</button> <a data-ng-disabled=\"pagination.totalItems < 1\" class=\"btn btn-default btn-sm\" ng-href=/api/shoes/export/csv download=zapatos.csv target=_self>Exportar</a> </div></div></div><div class=pull-right><div class=\"input-group input-group-sm\"><input class=form-control ng-model=query.reference typeahead=\"item for item in references | filter:$viewValue | limitTo:10\" autocomplete=off placeholder=Buscar data-ng-disabled=\"pagination.totalItems < 1 && !searching\" typeahead-on-select=pagination.search() data-ng-change=\"updateSearch('reference')\"><span class=input-group-btn><button class=\"btn btn-default btn-sm\" type=button data-ng-disabled=!searching data-ng-click=delSearch()><span class=\"glyphicon glyphicon-trash\"></span></button> <a class=\"btn btn-default btn-sm\" type=button data-ng-disabled=\"pagination.totalItems < 1 && !searching\" ui-sref=shoes.search><span class=\"glyphicon glyphicon-zoom-in\"></span></a></span></div></div></div><div ui-view=\"\"></div><div class=panel-body><div class=table-responsive data-ng-show=\"pagination.totalItems > 0 && !progress\"><table class=\"table text-center\"><thead><tr><th>Referencia <a ng-click=\"orderShoes('reference')\"><span ng-show=\"caret['reference']\" class=caret></span></a><div class=dropup ng-show=\"!caret['reference']\" ng-click=\"orderShoes('reference')\"><span class=caret></span></div></th><th>Marca <a ng-click=\"orderShoes('brand')\"><span ng-show=\"caret['brand']\" class=caret></span></a><div class=dropup ng-show=\"!caret['brand']\" ng-click=\"orderShoes('brand')\"><span class=caret></span></div></th><th>Categoría <a ng-click=\"orderShoes('category')\"><span ng-show=\"caret['category']\" class=caret></span></a><div class=dropup ng-show=\"!caret['category']\" ng-click=\"orderShoes('category')\"><span class=caret></span></div></th><th>Color <a ng-click=\"orderShoes('color')\"><span ng-show=\"caret['color']\" class=caret></span></a><div class=dropup ng-show=\"!caret['color']\" ng-click=\"orderShoes('color')\"><span class=caret></span></div></th><th>Talla <a ng-click=\"orderShoes('size')\"><span ng-show=\"caret['size']\" class=caret></span></a><div class=dropup ng-show=\"!caret['size']\" ng-click=\"orderShoes('size')\"><span class=caret></span></div></th><th>Precio <a ng-click=\"orderShoes('price')\"><span ng-show=\"caret['price']\" class=caret></span></a><div class=dropup ng-show=\"!caret['price']\" ng-click=\"orderShoes('price')\"><span class=caret></span></div></th><th>Cantidad <a ng-click=\"orderShoes('quantity')\"><span ng-show=\"caret['quantity']\" class=caret></span></a><div class=dropup ng-show=\"!caret['quantity']\" ng-click=\"orderShoes('quantity')\"><span class=caret></span></div></th><th>Acción</th></tr></thead><tbody><tr data-ng-repeat=\"item in items\" data-ng-class=\"{active: ($index%2)==0}\"><td>{{item.reference}}</td><td>{{item.brand}}</td><td>{{item.category}}</td><td><span class=color_circle style=background-color:{{getColorCode(item.color)}}></span> {{item.color}}</td><td>{{item.size}}</td><td>{{item.price}} &euro;</td><td>{{item.quantity}} <span ng-pluralize=\"\" count=item.quantity when=\"{'1': 'ud.','other': 'uds.'}\"></span></td><td><a class=\"btn btn-success btn-sm\" data-ng-click=\"editShoe(item['_id'])\" title=\"Ver Detalle\"><span class=\"glyphicon glyphicon-edit\"></span></a> <a class=\"btn btn-danger btn-sm\" data-ng-click=\"removeShoe(item['_id'])\" title=Borrar><span class=\"glyphicon glyphicon-remove\"></span></a> <a class=\"btn btn-sm\" ng-class=\"{'btn-info':item['has_qr'],'btn-warning':!item['has_qr']}\" data-ng-click=\"qrCode(item['_id'], item['has_qr'], $index)\" title=\"Código QR\"><span class=\"glyphicon glyphicon-qrcode\"></span></a> <a class=\"btn btn-primary btn-sm\" data-ng-click=\"barCode(item['barcode'])\" title=\"Código de Barras\"><span class=\"glyphicon glyphicon-barcode\"></span></a></td></tr></tbody></table></div><div data-ng-show=\"pagination.totalItems < 1 && !searching && !progress\" class=\"alert alert-warning\" style=margin:50px><p class=text-center>Vaya tela, tienes una tienda en la que ... <strong>!No hay ningún zapato!</strong></p><p class=text-center>Deberías incluir alguno. Si quieres, también puedes importarlos desde un fichero CSV.</p></div><div data-ng-show=\"pagination.totalItems < 1 && searching\" class=\"alert alert-warning\" style=margin:50px><p class=text-center><strong>!No hay ningún zapato con los criterios de búsqueda dados!</strong></p></div><div ng-show=progress style=\"width:300px;margin:20px auto\"><div class=\"progress progress-striped active\"><div class=progress-bar style=\"width: 100%\"></div></div></div></div><div class=panel-footer data-ng-show=\"pagination.numPages > 1 && !progress\"><div class=text-center><pagination boundary-links=true total-items=pagination.totalItems max-size=pagination.maxSize items-per-page=pagination.itemsPerPage page=pagination.currentPage class=pagination-sm num-pages=pagination.numPages previous-text=&lsaquo; next-text=&rsaquo; first-text=&laquo; last-text=&raquo; on-select-page=pagination.setPage(page)></pagination></div><small class=pull-left ng-show=\"pagination.itemsPerPage*pagination.currentPage>pagination.totalItems\">Mostrados {{pagination.itemsPerPage*(pagination.currentPage-1)}} al {{pagination.totalItems}} ({{pagination.totalItems}} resultados en {{pagination.numPages}} páginas)</small> <small class=pull-left ng-show=\"pagination.itemsPerPage*pagination.currentPage<=pagination.totalItems\">Mostrados {{pagination.itemsPerPage*(pagination.currentPage-1)}} al {{pagination.itemsPerPage*pagination.currentPage}} ({{pagination.totalItems}} resultados en {{pagination.numPages}} páginas)</small></div><div class=panel-footer data-ng-show=\"pagination.numPages <= 1\"></div></div></div>"
  );


  $templateCache.put('/static/partials/tickets.html',
    "<script type=text/ng-template id=ModalPrintTicket.html><div class=\"modal-content\">\n" +
    "    <div class=\"modal-header\">\n" +
    "      <h4 class=\"modal-title\">¡Ya está hecho!</h4>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "      \n" +
    "      <div class=\"text-center\">\n" +
    "        <p>A continuación se muestra el ticket de compra.</p><p> Si deseas, puedes modificarlo antes de imprimirlo</p>\n" +
    "        <textarea class=\"form-control\" ng-model=\"ticket\" rows=\"12\" wrap=\"off\" style=\"white-space:pre;word-wrap:normal;font-family:monospace;width:385px;margin:auto;\"></textarea>\n" +
    "      </div>\n" +
    "\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "      <button type=\"button\" class=\"btn btn-primary\" ng-click=\"print()\">Imprimir Ticket</button>\n" +
    "      <button type=\"button\" class=\"btn btn-default\" ng-click=\"ok()\">Salir</button>\n" +
    "    </div>\n" +
    "  </div><!-- /.modal-content --></script><div class=container><div class=row ng-show=processingTicket><div class=\"col-xs-12 col-md-12\"><div class=\"progress progress-striped active\"><div class=progress-bar style=\"width: 100%\"></div></div></div></div><div class=row data-ng-show=\"ticketNotice.visible && !progress\" data-ng-switch=ticketNotice.code><div class=\"col-xs-12 col-md-12\" ng-switch-when=1><div class=\"alert alert-danger\"><p class=text-center>Venta Realizada con problemas</p></div></div><div class=\"col-xs-12 col-md-12\" ng-switch-when=2><div class=\"alert alert-success\"><p class=text-center><strong>¡ La venta se ha realizado con éxito !</strong></p></div></div><div class=\"col-xs-12 col-md-12\" ng-switch-when=3><div class=\"alert alert-danger\"><p class=text-center>¡Hemos tenido problemas con la conexión. Inténtalo de nuevo!</p></div></div><div class=\"col-xs-12 col-md-12\" ng-switch-when=4><div class=\"alert alert-success\"><p class=text-center><strong>¡ La reserva se ha realizado con éxito !</strong></p></div></div></div><div ng-show=progress style=width:300px;margin:auto;height:50px;position:absolute;top:50%;left:50%;margin-top:-25px;margin-left:-150px><p class=text-center>Cargando, espere por favor &hellip;</p><div class=\"progress progress-striped active\"><div class=progress-bar style=\"width: 100%\"></div></div></div><div class=row ng-show=!progress><div class=\"col-xs-12 col-md-9\"><div ui-view=\"\"></div><div class=\"panel panel-default panel-custom\" data-ng-show=!oldTicketActived><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Venta de Stock</h3><div class=\"btn-group pull-right\"><button class=\"btn btn-default\" data-ng-disabled=\"ticketTotal == 0\" data-ng-click=newTicket()>Nuevo Ticket</button> <button class=\"btn btn-default\" data-ng-click=\"finishTicket('save',true)\" data-ng-disabled=\"ticketTotal == 0 || processingTicket\">Reservar</button> <button class=\"btn btn-default\" data-ng-click=\"finishTicket('order',true)\" data-ng-disabled=\"(ticketPM != 'credit' && !hasPaid()) || ticketTotal == 0 || processingTicket\">Terminar</button></div></div><div class=panel-body><div class=table-responsive data-ng-show=\"products.length > 0\"><table class=\"table text-center\"><thead><tr><th>Referencia</th><th>Descripción</th><th>Cantidad</th><th>PVP</th><th>Dto.</th><th>Subtotal</th><th>Quitar</th></tr></thead><tbody><tr data-ng-repeat=\"item in products\" data-ng-class=\"{active: ($index%2)==0}\"><td>{{item.reference}}</td><td>{{item.description}}</td><td><span class=\"glyphicon glyphicon-chevron-left pointer\" ng-show=\"item.quantity > 1 && !changingQty\" ng-click=\"decQty($index,item.type == 's')\"></span> {{item.quantity}} <span class=\"glyphicon glyphicon-chevron-right pointer\" ng-show=\"(item.shoe_qty > 0 && !changingQty) || item.type == 'c'\" ng-click=\"incQty($index,item.type == 's')\"></span></td><td>{{item.price}}</td><td><input ng-model=item.discount class=inline-editing-inactive data-ng-change=applySubRate($index)></td><td>{{item.subtotal}}</td><td><button type=button class=\"btn btn-danger btn-sm\" data-ng-click=\"removeFromTicket($index,item.type == 's')\"><span class=\"glyphicon glyphicon-remove\"></span></button></td></tr></tbody></table></div><div data-ng-show=\"products.length == 0\" class=\"alert alert-warning\" style=margin:50px><p class=text-center>Este ticket está vacío. No has añadido ningún producto aún.</p><p class=text-center>Puedes buscar los zapatos o complementos en el panel inferior</p></div></div><div class=\"panel-footer clearfix\"><div class=pull-left><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Impuesto (%)</span><input type=number class=form-control min=0 max=21 ng-model=ticketTax step=1 style=width:70px data-ng-disabled=\"ticketTotal == 0\" data-ng-change=applyRate(true)></div><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Descuento (%)</span><input type=number class=form-control min=0 ng-model=ticketDiscount step=1 style=width:70px data-ng-disabled=\"ticketTotal == 0\" data-ng-change=applyRate(false)></div></div><div class=\"btn-group pull-right\"><button type=button data-ng-disabled=\"(ticketPM != 'credit' && !hasPaid()) || ticketTotal == 0 || processingTicket\" data-ng-click=\"finishTicket('order',false)\" class=\"btn btn-sm btn-success\"><span class=\"glyphicon glyphicon-shopping-cart\"></span> Deprisa</button></div></div></div><div><tabset id=tickets-tab><tab><tab-heading>Zapatos<span class=\"glyphicon glyphicon-refresh\" style=margin-left:15px;cursor:pointer ng-click=shoes.pagination.search()></span></tab-heading><div class=\"panel panel-default\"><div class=panel-body><div class=table-responsive><table class=\"table text-center searchable\"><tbody><tr><td class=active><div class=input-group-sm><input class=form-control ng-model=shoes.barcode placeholder=\"Código Barras\" data-ng-change=shoes.pagination.search()></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=shoes.reference typeahead=\"item for item in shoes.references | filter:$viewValue | limitTo:6\" autocomplete=off placeholder=Referencia typeahead-on-select=shoes.pagination.search() data-ng-change=shoes.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=shoes.brand typeahead=\"item for item in shoes.brands | filter:$viewValue | limitTo:6\" autocomplete=off placeholder=Marca typeahead-on-select=shoes.pagination.search() data-ng-change=shoes.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=shoes.color typeahead=\"item as item.color for item in colors | filter:$viewValue | limitTo:6\" autocomplete=off typeahead-template-url=searchAutocompleteTpl.html placeholder=Color data-ng-change=shoes.pagination.search() typeahead-on-select=shoes.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm><input type=number class=form-control ng-model=shoes.size data-ng-change=shoes.pagination.search() placeholder=Talla min=18 max=45 style=width:65px></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=shoes.category typeahead=\"item for item in ['HOMBRES','MUJERES','NIÑOS'] | filter:$viewValue \" autocomplete=off placeholder=Categoría data-ng-change=shoes.pagination.search() typeahead-on-select=shoes.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><button class=\"btn btn-default btn-sm\" type=button data-ng-click=shoes.reset()><span class=\"glyphicon glyphicon-trash\"></span></button></td></tr></tbody></table></div><div class=table-responsive data-ng-show=\"shoes.pagination.totalItems > 0\"><table class=\"table text-center\"><thead><tr><th>Referencia</th><th>Marca</th><th>Categoría</th><th>Color</th><th>Talla</th><th>Precio</th><th>Cantidad</th><th>Acción</th></tr></thead><tbody><tr data-ng-repeat=\"item in shoes.items\" data-ng-class=\"{active: ($index%2)==0}\"><td>{{item.reference}}</td><td>{{item.brand}}</td><td>{{item.category}}</td><td><span class=color_circle style=background-color:{{getColorCode(item.color)}}></span> {{item.color}}</td><td>{{item.size}}</td><td>{{item.price}} &euro;</td><td>{{item.quantity}} <span ng-pluralize=\"\" count=item.quantity when=\"{'1': 'ud.','other': 'uds.'}\"></span></td><td><button type=button class=\"btn btn-primary btn-sm\" data-ng-disabled=\"item.quantity == 0\" data-ng-click=addToTicket(true,$index)>Añadir</button></td></tr></tbody></table></div><div class=text-center data-ng-show=\"shoes.pagination.pages > 1\"><pagination boundary-links=true total-items=shoes.pagination.totalItems max-size=shoes.pagination.maxSize items-per-page=shoes.pagination.itemsPerPage page=shoes.pagination.currentPage class=pagination-sm previous-text=&lsaquo; next-text=&rsaquo; first-text=&laquo; last-text=&raquo; on-select-page=shoes.pagination.setPage(page) num-pages=shoes.pagination.pages></pagination></div></div></div></tab><tab heading=Complementos><div class=\"panel panel-default\"><div class=panel-body><div class=table-responsive><form kz-submit=addToTicket(false) name=ticketsComplementsForm novalidate><table class=\"table text-center searchable\"><tbody><tr><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.ticketsComplementsForm.needsAttention(ticketsComplementsForm.creference)}\"><input class=form-control ng-model=complements.reference typeahead=\"item for item in complements.references | filter:$viewValue | limitTo:6\" autocomplete=off placeholder=Referencia typeahead-position=shoes.thPosition name=creference required></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=complements.brand placeholder=Marca></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=complements.color typeahead=\"item as item.color for item in colors | filter:$viewValue | limitTo:8\" autocomplete=off typeahead-template-url=searchAutocompleteTpl.html placeholder=Color typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.ticketsComplementsForm.needsAttention(ticketsComplementsForm.cprice)}\"><input type=number class=form-control ng-model=complements.price placeholder=Precio name=cprice min=0 required></div></td><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.ticketsComplementsForm.needsAttention(ticketsComplementsForm.cquantity)}\"><input type=number class=form-control ng-model=complements.quantity placeholder=Cantidad name=cquantity min=1 required></div></td><td class=active><button class=\"btn btn-default btn-sm\" type=button data-ng-click=complements.reset()><span class=\"glyphicon glyphicon-trash\"></span></button></td><td class=active><input type=submit class=\"btn btn-primary btn-sm\" value=Añadir></td></tr></tbody></table></form></div></div></div></tab><tab heading=Tickets><div class=\"panel panel-default\"><div class=panel-body><div class=table-responsive><table class=\"table text-center searchable\"><tbody><tr><td class=active><div class=input-group-sm><input class=form-control ng-model=tickets.code typeahead=\"item for item in tickets.codes | filter:$viewValue | limitTo:10\" autocomplete=off placeholder=Código typeahead-on-select=tickets.pagination.search() data-ng-change=tickets.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=tickets.date placeholder=Fecha data-ng-change=tickets.pagination.search()></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=tickets.employee typeahead=\"item for item in tickets.employees | filter:$viewValue | limitTo:10\" autocomplete=off placeholder=Empleado typeahead-on-select=tickets.pagination.search() data-ng-change=tickets.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=tickets.state typeahead=\"item for item in tickets.states | filter:$viewValue | limitTo:8\" autocomplete=off placeholder=Estado data-ng-change=tickets.pagination.search() typeahead-position=shoes.thPosition typeahead-on-select=tickets.pagination.search()></div></td><td class=active><button class=\"btn btn-default btn-sm\" type=button data-ng-click=tickets.reset()><span class=\"glyphicon glyphicon-trash\"></span></button> <button type=button class=\"btn btn-primary btn-sm\" ng-click=tickets.setToday()>Hoy</button></td></tr></tbody></table></div><div class=table-responsive data-ng-show=\"tickets.pagination.totalItems > 0\"><table class=\"table text-center\"><thead><tr><th>Código</th><th>Fecha</th><th>Empleado</th><th>Estado</th><th>Acción</th></tr></thead><tbody><tr data-ng-repeat=\"item in tickets.items\" data-ng-class=\"{active: ($index%2)==0}\"><td>{{item.code}}</td><td>{{tickets.parseDate(item.date_end)}}</td><td>{{item.employee}}</td><td>{{item.status}}</td><td><button type=button class=\"btn btn-danger btn-sm\" data-ng-show=\"item.status == 'RESERVADO'\" data-ng-click=\"tickets.abortTicket(item.code, $index)\" data-ng-disabled=item.disabled>Anular</button> <a ui-sref=\"tickets.reserve({ code: item.code })\" class=\"btn btn-success btn-sm\" data-ng-show=\"item.status == 'RESERVADO'\">Cobrar</a> <a ui-sref=\"tickets.return({ code: item.code })\" class=\"btn btn-danger btn-sm\" data-ng-show=\"item.status == 'VENDIDO'\">Devolver</a> <button type=button class=\"btn btn-success btn-sm\" data-ng-show=\"item.status == 'VENDIDO'\" data-ng-click=tickets.reprintTicket($index)>Reimprimir</button></td></tr></tbody></table></div><div class=text-center data-ng-show=\"tickets.pagination.pages > 1\"><pagination boundary-links=true total-items=tickets.pagination.totalItems max-size=tickets.pagination.maxSize items-per-page=tickets.pagination.itemsPerPage page=tickets.pagination.currentPage class=pagination-sm previous-text=&lsaquo; next-text=&rsaquo; first-text=&laquo; last-text=&raquo; on-select-page=tickets.pagination.setPage(page) num-pages=tickets.pagination.pages></pagination></div></div></div></tab><tab heading=Caja><div class=\"panel panel-default\"><div class=panel-body><div class=table-responsive><table class=\"table text-center searchable\"><tbody><tr><td class=active><div class=input-group-sm><input class=form-control placeholder=Fecha data-ng-model=box.date></div></td><td class=active><div class=input-group-sm><input type=number class=form-control placeholder=\"Deposito Inicial\" min=0 data-ng-model=box.initialCash data-ng-change=box.applyInitCash()></div></td><td class=active><button class=\"btn btn-default btn-sm\" type=button data-ng-click=box.reset()><span class=\"glyphicon glyphicon-trash\"></span></button><div class=btn-group><button type=button class=\"btn btn-sm btn-default\" ng-click=box.makeBox()>Hacer Caja</button> <button type=button class=\"btn btn-sm btn-default dropdown-toggle\" ng-disabled=\"box.total == 0 || !box.result.length\"><span class=caret></span></button><ul class=dropdown-menu><li><a ng-click=box.printToPDF()>Imprimir PDF</a></li><li><a ng-click=box.printToTicket()>Imprimir Ticket</a></li></ul></div></td><td class=active ng-show=box.result.length><div class=input-group-sm><span class=input-group-addon style=text-align:center;width:90px>{{box.total}} &euro;</span></div></td></tr></tbody></table></div><div style=margin:50px ng-show=box.progress><div class=\"progress progress-striped active\"><div class=progress-bar style=\"width: 100%\"></div></div></div><div class=\"alert alert-warning\" style=margin:50px ng-show=\"!box.progress && !box.result.length\"><p class=text-center><strong>¡ Hoy no se ha realizado ninguna operación ... !</strong></p><p class=text-center>Recuerda, desde esta sección puedes obtener un resumen de las operaciones realizadas al cabo de la joranada laboral.</p></div><div class=table-responsive ng-show=\"!box.progress && box.result.length\"><table id=tickets_box_summary class=\"table text-center\"><thead><tr><th>Emplead@</th><th>Ventas</th><th>Dev. (Vale)</th><th>Dev. (&euro;)</th><th>Reservas</th><th>T. Efectivo</th><th>T. Tarjeta</th><th>T. Devuelto</th><th>Total (&euro;)</th><th>Caja (&euro;)</th></tr></thead><tbody class=box-resume><tr data-ng-repeat=\"item in box.result\" data-ng-class=\"{active: ($index%2)==0 && $index+1<box.result.length}\"><td>{{item.employee}}</td><td>{{item.ordered}}</td><td>{{item.returned_voucher}}</td><td>{{item.returned_cash}}</td><td>{{item.booked}}</td><td>{{item.total_cash}}</td><td>{{item.total_credit}}</td><td>{{item.total_rcash}}</td><td>{{item.total}}</td><td>{{item.total_box}}</td></tr></tbody></table></div></div></div></tab></tabset></div></div><div class=\"col-xs-12 col-md-3\"><div class=\"panel panel-default\"><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Resumen Venta</h3></div><div class=panel-body><div class=text-center><div class=form-group><label class=control-label for=ticket_total style=font-size:28px>TOTAL</label><div class=input-group><input class=\"form-control total-ticket\" id=ticket_total data-ng-model=ticketTotal disabled><span class=input-group-addon>&euro;</span></div></div><div class=\"form-group has-success\"><label class=control-label for=ticket_received style=font-size:28px>ENTREGA</label><div class=input-group><input class=\"form-control total-ticket\" style=background-color:#D7EFDB data-ng-model=ticketReceived id=ticket_received data-ng-change=computeExchange() data-ng-disabled=\"ticketPM == 'credit' || ticketPM == 'combined'\"><span class=input-group-addon>&euro;</span></div></div><div class=\"form-group has-error\"><label class=control-label for=ticket_returned style=font-size:28px>CAMBIO</label><div class=input-group><input class=\"form-control total-ticket\" style=background-color:#f2dede data-ng-model=ticketReturned id=ticket_returned disabled><span class=input-group-addon>&euro;</span></div></div></div></div><div class=panel-footer></div></div><div class=\"panel panel-default\" data-ng-show=\"ticketTotal != 0\"><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Forma de Pago</h3></div><div class=panel-body><div><div class=radio><label for=ticket_paymethod_cash><input type=radio id=ticket_paymethod_cash data-ng-model=ticketPM value=cash data-ng-click=payment_method.reset()>Efectivo</label></div><div class=radio data-ng-show=\"ticketTotal > 0\"><label for=ticket_paymethod_credit><input type=radio id=ticket_paymethod_credit data-ng-model=ticketPM value=credit data-ng-click=payment_method.reset()>Tarjeta Crédito</label></div><div class=radio><label for=ticket_paymethod_voucher><input type=radio id=ticket_paymethod_voucher data-ng-model=ticketPM value=voucher data-ng-click=\"payment_method.reset('voucher')\">Cheque Vale</label><div ng-show=payment_method.voucher style=position:relative;left:-20px><table style=\"margin:10px 0\"><tr><td><div data-ng-class=\"{'has-error': payment_method.voucher_code_error}\"><input class=form-control data-ng-model=payment_method.voucher_code></div></td><td><button class=\"btn btn-default\" type=button data-ng-click=payment_method.validate()><span class=\"glyphicon glyphicon-question-sign\"></span></button></td></tr></table></div></div><div class=radio data-ng-show=\"ticketTotal > 0\"><label for=ticket_paymethod_combined><input type=radio id=ticket_paymethod_combined data-ng-model=ticketPM value=combined data-ng-click=\"payment_method.reset('combined')\">Pago Combinado</label><div ng-show=payment_method.combined style=\"margin:15px 0;position:relative;left:-20px\"><div>Efectivo:<input type=number min=0 class=form-control placeholder=Efectivo data-ng-model=payment_method.combined_cash data-ng-change=payment_method.compute_combined()></div><div style=margin-top:5px>Tarjeta Credito:<input type=number min=0 class=form-control placeholder=\"Tarjeta Crédito\" data-ng-model=payment_method.combined_credit data-ng-change=payment_method.compute_combined()></div><div style=margin-top:5px>Cheque Vale:<input type=number min=0 class=form-control placeholder=\"Cheque Vale\" data-ng-model=payment_method.combined_voucher data-ng-change=payment_method.compute_combined()></div><div style=margin-top:8px data-ng-show=\"payment_method.combined_needed > 0\"><p>HASTA TOTAL FALTAN: {{payment_method.combined_needed}} EUROS</p></div></div></div></div></div><div class=panel-footer></div></div></div></div></div>"
  );


  $templateCache.put('/static/partials/tickets_bk.html',
    "<div class=container><div class=row ng-show=processingTicket><div class=\"col-xs-12 col-md-12\"><div class=\"progress progress-striped active\"><div class=progress-bar style=\"width: 100%\"></div></div></div></div><div class=row data-ng-show=\"ticketNotice.visible && !progress\" data-ng-switch=ticketNotice.code><div class=\"col-xs-12 col-md-12\" ng-switch-when=1><div class=\"alert alert-danger\"><p class=text-center>Venta Realizada con problemas</p></div></div><div class=\"col-xs-12 col-md-12\" ng-switch-when=2><div class=\"alert alert-success\"><p class=text-center><strong>¡ La venta se ha realizado con éxito !</strong></p></div></div><div class=\"col-xs-12 col-md-12\" ng-switch-when=3><div class=\"alert alert-danger\"><p class=text-center>¡Hemos tenido problemas con la conexión. Inténtalo de nuevo!</p></div></div><div class=\"col-xs-12 col-md-12\" ng-switch-when=4><div class=\"alert alert-success\"><p class=text-center><strong>¡ La reserva se ha realizado con éxito !</strong></p></div></div></div><div ng-show=progress style=width:300px;margin:auto;height:50px;position:absolute;top:50%;left:50%;margin-top:-25px;margin-left:-150px><p class=text-center>Cargando, espere por favor &hellip;</p><div class=\"progress progress-striped active\"><div class=progress-bar style=\"width: 100%\"></div></div></div><div class=row ng-show=!progress><div data-ng-class=\"{'col-xs-12 col-md-9': ticketTotal > 0, 'col-xs-12 col-md-12': ticketTotal == 0}\"><div ui-view=\"\"><div class=\"panel panel-default panel-custom\"><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Venta de Stock</h3><div class=\"btn-group pull-right\"><button class=\"btn btn-default\" data-ng-disabled=\"ticketTotal == 0\" data-ng-click=newTicket()>Nuevo Ticket</button> <button class=\"btn btn-default\" data-ng-click=\"finishTicket('save',true)\" data-ng-disabled=\"ticketTotal == 0 || processingTicket\">Reservar</button> <button class=\"btn btn-default\" data-ng-click=\"finishTicket('order',true)\" data-ng-disabled=\"(ticketPM == 'cash' && !hasPaid()) || ticketTotal == 0 || processingTicket\">Terminar</button></div></div><div class=panel-body><div class=table-responsive data-ng-show=\"ticketTotal > 0\"><table class=\"table text-center\"><thead><tr><th>Referencia</th><th>Descripción</th><th>Cantidad</th><th>PVP</th><th>Dto.</th><th>Subtotal</th><th>Quitar</th></tr></thead><tbody><tr data-ng-repeat=\"item in products\" data-ng-class=\"{active: ($index%2)==0}\"><td>{{item.reference}}</td><td>{{item.description}}</td><td><span class=\"glyphicon glyphicon-chevron-left pointer\" ng-show=\"item.quantity > 1 && !changingQty\" ng-click=\"decQty($index,item.type == 's')\"></span> {{item.quantity}} <span class=\"glyphicon glyphicon-chevron-right pointer\" ng-show=\"(item.shoe_qty > 0 && !changingQty) || item.type == 'c'\" ng-click=\"incQty($index,item.type == 's')\"></span></td><td>{{item.price}}</td><td><input ng-model=item.discount class=inline-editing-inactive data-ng-change=applySubRate($index)></td><td>{{item.subtotal}}</td><td><button type=button class=\"btn btn-danger btn-sm\" data-ng-click=\"removeFromTicket($index,item.type == 's')\"><span class=\"glyphicon glyphicon-remove\"></span></button></td></tr></tbody></table></div><div data-ng-show=\"ticketTotal == 0\" class=\"alert alert-warning\" style=margin:50px><p class=text-center>Este ticket está vacío. No has añadido ningún producto aún.</p><p class=text-center>Puedes buscar los zapatos o complementos en el panel inferior</p></div></div><div class=\"panel-footer clearfix\"><div class=pull-left><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Impuesto (%)</span><input type=number class=form-control min=0 max=21 ng-model=ticketTax step=1 style=width:70px data-ng-disabled=\"ticketTotal == 0\" data-ng-change=applyRate(true)></div><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Descuento (%)</span><input type=number class=form-control min=0 ng-model=ticketDiscount step=1 style=width:70px data-ng-disabled=\"ticketTotal == 0\" data-ng-change=applyRate(false)></div></div><div class=\"btn-group pull-right\"><button type=button data-ng-disabled=\"(ticketPM == 'cash' && !hasPaid()) || ticketTotal == 0 || processingTicket\" data-ng-click=\"finishTicket('order',false)\" class=\"btn btn-sm btn-success\"><span class=\"glyphicon glyphicon-shopping-cart\"></span> Deprisa</button></div></div></div></div><div><tabset id=tickets-tab><tab heading=Zapatos><div class=\"panel panel-default\"><div class=panel-body><div class=table-responsive><table class=\"table text-center searchable\"><tbody><tr><td class=active><div class=input-group-sm><input class=form-control ng-model=shoes.barcode placeholder=\"Código Barras\" data-ng-change=shoes.pagination.search()></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=shoes.reference typeahead=\"item for item in shoes.references | filter:$viewValue | limitTo:6\" autocomplete=off placeholder=Referencia typeahead-on-select=shoes.pagination.search() data-ng-change=shoes.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=shoes.brand typeahead=\"item for item in shoes.brands | filter:$viewValue | limitTo:6\" autocomplete=off placeholder=Marca typeahead-on-select=shoes.pagination.search() data-ng-change=shoes.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=shoes.color typeahead=\"item as item.color for item in colors | filter:$viewValue | limitTo:6\" autocomplete=off typeahead-template-url=searchAutocompleteTpl.html placeholder=Color data-ng-change=shoes.pagination.search() typeahead-on-select=shoes.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm><input type=number class=form-control ng-model=shoes.size data-ng-change=shoes.pagination.search() placeholder=Talla min=18 max=45></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=shoes.category typeahead=\"item for item in ['HOMBRES','MUJERES','NIÑOS'] | filter:$viewValue \" autocomplete=off placeholder=Categoría data-ng-change=shoes.pagination.search() typeahead-on-select=shoes.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><button class=\"btn btn-default btn-sm\" type=button data-ng-click=shoes.reset()><span class=\"glyphicon glyphicon-trash\"></span></button></td></tr></tbody></table></div><div class=table-responsive data-ng-show=\"shoes.pagination.totalItems > 0\"><table class=\"table text-center\"><thead><tr><th>Referencia</th><th>Marca</th><th>Categoría</th><th>Color</th><th>Talla</th><th>Precio</th><th>Cantidad</th><th>Acción</th></tr></thead><tbody><tr data-ng-repeat=\"item in shoes.items\" data-ng-class=\"{active: ($index%2)==0}\"><td>{{item.reference}}</td><td>{{item.brand}}</td><td>{{item.category}}</td><td><span class=color_circle style=background-color:{{getColorCode(item.color)}}></span> {{item.color}}</td><td>{{item.size}}</td><td>{{item.price}} &euro;</td><td>{{item.quantity}} <span ng-pluralize=\"\" count=item.quantity when=\"{'1': 'ud.','other': 'uds.'}\"></span></td><td><button type=button class=\"btn btn-primary btn-sm\" data-ng-disabled=\"item.quantity == 0\" data-ng-click=addToTicket(true,$index)>Añadir</button></td></tr></tbody></table></div><div class=text-center data-ng-show=\"shoes.pagination.pages > 1\"><pagination boundary-links=true total-items=shoes.pagination.totalItems max-size=shoes.pagination.maxSize items-per-page=shoes.pagination.itemsPerPage page=shoes.pagination.currentPage class=pagination-sm previous-text=&lsaquo; next-text=&rsaquo; first-text=&laquo; last-text=&raquo; on-select-page=shoes.pagination.setPage(page) num-pages=shoes.pagination.pages></pagination></div></div></div></tab><tab heading=Complementos><div class=\"panel panel-default\"><div class=panel-body><div class=table-responsive><form kz-submit=addToTicket(false) name=ticketsComplementsForm novalidate><table class=\"table text-center searchable\"><tbody><tr><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.ticketsComplementsForm.needsAttention(ticketsComplementsForm.creference)}\"><input class=form-control ng-model=complements.reference typeahead=\"item for item in complements.references | filter:$viewValue | limitTo:6\" autocomplete=off placeholder=Referencia typeahead-position=shoes.thPosition name=creference required></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=complements.brand placeholder=Marca></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=complements.color typeahead=\"item as item.color for item in colors | filter:$viewValue | limitTo:8\" autocomplete=off typeahead-template-url=searchAutocompleteTpl.html placeholder=Color typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.ticketsComplementsForm.needsAttention(ticketsComplementsForm.cprice)}\"><input type=number class=form-control ng-model=complements.price placeholder=Precio name=cprice min=0 required></div></td><td class=active><div class=input-group-sm ng-class=\"{'has-error': kz.ticketsComplementsForm.needsAttention(ticketsComplementsForm.cquantity)}\"><input type=number class=form-control ng-model=complements.quantity placeholder=Cantidad name=cquantity min=1 required></div></td><td class=active><button class=\"btn btn-default btn-sm\" type=button data-ng-click=complements.reset()><span class=\"glyphicon glyphicon-trash\"></span></button></td><td class=active><input type=submit class=\"btn btn-primary btn-sm\" value=Añadir></td></tr></tbody></table></form></div></div></div></tab><tab heading=Tickets><div class=\"panel panel-default\"><div class=panel-body><div class=table-responsive><table class=\"table text-center searchable\"><tbody><tr><td class=active><div class=input-group-sm><input class=form-control ng-model=tickets.code typeahead=\"item for item in tickets.codes | filter:$viewValue | limitTo:10\" autocomplete=off placeholder=Código typeahead-on-select=tickets.pagination.search() data-ng-change=tickets.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=tickets.date placeholder=Fecha data-ng-change=tickets.pagination.search()></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=tickets.employee typeahead=\"item for item in tickets.employees | filter:$viewValue | limitTo:10\" autocomplete=off placeholder=Empleado typeahead-on-select=tickets.pagination.search() data-ng-change=tickets.pagination.search() typeahead-position=shoes.thPosition></div></td><td class=active><div class=input-group-sm><input class=form-control ng-model=tickets.state typeahead=\"item for item in tickets.states | filter:$viewValue | limitTo:8\" autocomplete=off placeholder=Estado data-ng-change=tickets.pagination.search() typeahead-position=shoes.thPosition typeahead-on-select=tickets.pagination.search()></div></td><td class=active><button class=\"btn btn-default btn-sm\" type=button data-ng-click=tickets.reset()><span class=\"glyphicon glyphicon-trash\"></span></button> <button type=button class=\"btn btn-primary btn-sm\" ng-click=tickets.setToday()>Hoy</button></td></tr></tbody></table></div><div class=table-responsive data-ng-show=\"tickets.pagination.totalItems > 0\"><table class=\"table text-center\"><thead><tr><th>Código</th><th>Fecha</th><th>Empleado</th><th>Estado</th><th>Acción</th></tr></thead><tbody><tr data-ng-repeat=\"item in tickets.items\" data-ng-class=\"{active: ($index%2)==0}\"><td>{{item.code}}</td><td>{{tickets.parseDate(item.date)}}</td><td>{{item.employee}}</td><td>{{item.status}}</td><td><button type=button class=\"btn btn-danger btn-sm\" data-ng-show=\"item.status == 'RESERVADO'\" data-ng-click=tickets.abortTicket(item.code)>Anular</button> <a ui-sref=\"tickets.reserve({ code: item.code })\" class=\"btn btn-success btn-sm\" data-ng-show=\"item.status == 'RESERVADO'\">Terminar</a> <a ui-sref=\"tickets.return({ code: item.code })\" class=\"btn btn-danger btn-sm\" data-ng-show=\"item.status == 'VENDIDO'\">Devolver</a> <button type=button class=\"btn btn-success btn-sm\" data-ng-show=\"item.status == 'VENDIDO'\" data-ng-click=tickets.reprintTicket($index)>Reimprimir</button></td></tr></tbody></table></div><div class=text-center data-ng-show=\"tickets.pagination.pages > 1\"><pagination boundary-links=true total-items=tickets.pagination.totalItems max-size=tickets.pagination.maxSize items-per-page=tickets.pagination.itemsPerPage page=tickets.pagination.currentPage class=pagination-sm previous-text=&lsaquo; next-text=&rsaquo; first-text=&laquo; last-text=&raquo; on-select-page=tickets.pagination.setPage(page) num-pages=tickets.pagination.pages></pagination></div></div></div></tab></tabset></div></div><div class=\"col-xs-12 col-md-3\" data-ng-show=\"ticketTotal != 0 || oldTicketActived\"><div class=\"panel panel-default\"><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Resumen Venta</h3></div><div class=panel-body><div class=text-center><div class=form-group><label class=control-label for=ticket_total style=font-size:28px>TOTAL</label><div class=input-group><input class=\"form-control total-ticket\" id=ticket_total data-ng-model=ticketTotal disabled><span class=input-group-addon>&euro;</span></div></div><div class=\"form-group has-success\"><label class=control-label for=ticket_received style=font-size:28px>ENTREGA</label><div class=input-group><input class=\"form-control total-ticket\" style=background-color:#D7EFDB data-ng-model=ticketReceived id=ticket_received data-ng-change=computeExchange() data-ng-disabled=\"ticketPM != 'cash'\"><span class=input-group-addon>&euro;</span></div></div><div class=\"form-group has-error\"><label class=control-label for=ticket_returned style=font-size:28px>CAMBIO</label><div class=input-group><input class=\"form-control total-ticket\" style=background-color:#f2dede data-ng-model=ticketReturned id=ticket_returned disabled><span class=input-group-addon>&euro;</span></div></div></div></div><div class=panel-footer></div></div><div class=\"panel panel-default\"><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Forma de Pago</h3></div><div class=panel-body><div><div class=radio><label for=ticket_paymethod_cash><input type=radio id=ticket_paymethod_cash data-ng-model=ticketPM value=cash>Efectivo</label></div><div class=radio><label for=ticket_paymethod_credit><input type=radio id=ticket_paymethod_credit data-ng-model=ticketPM value=credit>Tarjeta Crédito</label></div><div class=radio><label for=ticket_paymethod_voucher><input type=radio id=ticket_paymethod_voucher data-ng-model=ticketPM value=voucher>Cheque Vale</label></div></div></div><div class=panel-footer></div></div></div></div></div>"
  );


  $templateCache.put('/static/partials/tickets_reserve.html',
    "<div class=\"panel panel-default panel-custom\"><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Tu Reserva: {{code}}</h3><div class=\"btn-group pull-right\"><button class=\"btn btn-default\" data-ng-click=cancel()>Nuevo Ticket</button> <button class=\"btn btn-default\" data-ng-click=$parent.tickets.abortTicket(code)>Anular Reserva</button> <button class=\"btn btn-default\" data-ng-disabled=\"($parent.ticketPM == 'cash' && !$parent.hasPaid()) || $parent.processingTicket\" data-ng-click=saveTicket()>Finalizar Reserva</button></div></div><div class=panel-body><div class=table-responsive><table class=\"table text-center\"><thead><tr><th>Referencia</th><th>Descripción</th><th>Cantidad</th><th>PVP</th><th>Dto.</th><th>Subtotal</th></tr></thead><tbody><tr data-ng-repeat=\"item in savedProducts\" data-ng-class=\"{active: ($index%2)==0}\"><td>{{item.reference}}</td><td>{{item.description}}</td><td>{{item.quantity}}</td><td>{{item.price}}</td><td>{{item.discount}}</td><td>{{item.subtotal}}</td></tr></tbody></table></div></div><div class=\"panel-footer clearfix\"><div class=pull-left ng-show=\"$parent.products.length == 0\"><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Impuesto (%)</span><input type=number class=form-control min=0 max=21 ng-model=savedTicketTax step=1 style=width:70px disabled></div><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Descuento (%)</span><input type=number class=form-control min=0 ng-model=savedTicketDiscount step=1 style=width:70px disabled></div></div><div class=pull-right><p style=font-weight:bold;font-size:15px;position:relative;top:5px>TOTAL RESERVA: {{totalAdjusted()}}</p></div></div></div><div class=\"panel panel-default panel-custom\" data-ng-show=\"$parent.products.length > 0\"><div class=\"panel-heading clearfix\"><h3 class=panel-title>Añadir a la Reserva</h3></div><div class=panel-body><div class=table-responsive><table class=\"table text-center\"><thead><tr><th>Referencia</th><th>Descripción</th><th>Cantidad</th><th>PVP</th><th>Dto.</th><th>Subtotal</th><th>Quitar</th></tr></thead><tbody><tr data-ng-repeat=\"item in $parent.products\" data-ng-class=\"{active: ($index%2)==0}\"><td>{{item.reference}}</td><td>{{item.description}}</td><td><span class=\"glyphicon glyphicon-chevron-left pointer\" ng-show=\"item.quantity > 1 && !$parent.changingQty\" ng-click=\"$parent.decQty($index,item.type == 's')\"></span> {{item.quantity}} <span class=\"glyphicon glyphicon-chevron-right pointer\" ng-show=\"(item.shoe_qty > 0 && !$parent.changingQty) || item.type == 'c'\" ng-click=\"$parent.incQty($index,item.type == 's')\"></span></td><td>{{item.price}}</td><td><input ng-model=item.discount class=inline-editing-inactive data-ng-change=$parent.applySubRate($index)></td><td>{{item.subtotal}}</td><td><button type=button class=\"btn btn-danger btn-sm\" data-ng-click=\"$parent.removeFromTicket($index,item.type == 's')\"><span class=\"glyphicon glyphicon-remove\"></span></button></td></tr></tbody></table></div></div><div class=\"panel-footer clearfix\"><div class=pull-left><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Impuesto (%)</span><input type=number class=form-control min=0 max=21 ng-model=$parent.ticketTax step=1 style=width:70px data-ng-disabled=\"$parent.products.length == 0\" data-ng-change=$parent.applyRate(true)></div><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Descuento (%)</span><input type=number class=form-control min=0 ng-model=$parent.ticketDiscount step=1 style=width:70px data-ng-disabled=\"$parent.products.length == 0\" data-ng-change=$parent.applyRate(false)></div></div><div class=pull-right><p style=font-weight:bold;font-size:15px;position:relative;top:5px>TOTAL VENTA: {{$parent.ticketTotal - totalAdjusted()}}</p></div></div></div>"
  );


  $templateCache.put('/static/partials/tickets_return.html',
    "<div class=\"panel panel-default panel-custom\"><div class=\"panel-heading clearfix\"><h3 class=\"panel-title pull-left\">Devolución de Stock: {{code}}</h3><div class=\"btn-group pull-right\"><button class=\"btn btn-default\" data-ng-click=cancel()>Nuevo Ticket</button> <button class=\"btn btn-default\" data-ng-disabled=\"($parent.ticketPM == 'cash' && !$parent.hasPaid()) || $parent.processingTicket || $parent.oldTicketInfo.total == 0\" data-ng-click=returnTicket()>Finalizar Devolución</button></div></div><div class=panel-body><div class=table-responsive><table class=\"table text-center\"><thead><tr><th>Referencia</th><th>Descripción</th><th>Cantidad</th><th>PVP</th><th>Dto.</th><th>Subtotal</th><th>Devolver</th></tr></thead><tbody><tr data-ng-repeat=\"item in returnProducts\" data-ng-class=\"{active: ($index%2)==0}\"><td>{{item.reference}}</td><td>{{item.description}}</td><td><span class=\"glyphicon glyphicon-chevron-left pointer\" ng-show=\"item.quantity > 1\" ng-click=decReturnQty($index)></span> {{item.quantity}} <span class=\"glyphicon glyphicon-chevron-right pointer\" ng-show=\"item.quantity < item.totalQuantity\" ng-click=incReturnQty($index)></span></td><td>{{item.price}}</td><td>{{item.discount}}</td><td>{{item.subtotal}}</td><td><button type=button class=\"btn btn-sm btn-default\" style=width:40px;height:30px ng-model=item.returned ng-click=returnItem($index) btn-checkbox=\"\"><span class=\"glyphicon glyphicon-remove\" ng-show=item.returned></span></button></td></tr></tbody></table></div></div><div class=\"panel-footer clearfix\"><div class=pull-left><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Impuesto (%)</span><input type=number class=form-control min=0 max=21 ng-model=returnTicketTax step=1 style=width:70px disabled></div><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Descuento (%)</span><input type=number class=form-control min=0 ng-model=returnTicketDiscount step=1 style=width:70px disabled></div></div><div class=pull-right><p style=font-weight:bold;font-size:15px;position:relative;top:5px>TOTAL DEVOLUCIÓN: {{returnTicketTotal}}</p></div></div></div><div class=\"panel panel-default panel-custom\" data-ng-show=\"$parent.products.length > 0\"><div class=\"panel-heading clearfix\"><h3 class=panel-title>Añadir a la Devolución</h3></div><div class=panel-body><div class=table-responsive><table class=\"table text-center\"><thead><tr><th>Referencia</th><th>Descripción</th><th>Cantidad</th><th>PVP</th><th>Dto.</th><th>Subtotal</th><th>Quitar</th></tr></thead><tbody><tr data-ng-repeat=\"item in $parent.products\" data-ng-class=\"{active: ($index%2)==0}\"><td>{{item.reference}}</td><td>{{item.description}}</td><td><span class=\"glyphicon glyphicon-chevron-left pointer\" ng-show=\"item.quantity > 1 && !$parent.changingQty\" ng-click=\"$parent.decQty($index,item.type == 's')\"></span> {{item.quantity}} <span class=\"glyphicon glyphicon-chevron-right pointer\" ng-show=\"(item.shoe_qty > 0 && !$parent.changingQty) || item.type == 'c'\" ng-click=\"$parent.incQty($index,item.type == 's')\"></span></td><td>{{item.price}}</td><td><input ng-model=item.discount class=inline-editing-inactive data-ng-change=$parent.applySubRate($index)></td><td>{{item.subtotal}}</td><td><button type=button class=\"btn btn-danger btn-sm\" data-ng-click=\"$parent.removeFromTicket($index,item.type == 's')\"><span class=\"glyphicon glyphicon-remove\"></span></button></td></tr></tbody></table></div></div><div class=\"panel-footer clearfix\"><div class=pull-left><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Impuesto (%)</span><input type=number class=form-control min=0 max=21 ng-model=$parent.ticketTax step=1 style=width:70px data-ng-disabled=\"$parent.products.length == 0\" data-ng-change=$parent.applyRate(true)></div><div class=\"input-group input-group-sm pull-left\"><span class=input-group-addon>Descuento (%)</span><input type=number class=form-control min=0 ng-model=$parent.ticketDiscount step=1 style=width:70px data-ng-disabled=\"$parent.products.length == 0\" data-ng-change=$parent.applyRate(false)></div></div><div class=pull-right><p style=font-weight:bold;font-size:15px;position:relative;top:5px>TOTAL VENTA: {{$parent.ticketTotal - $parent.oldTicketInfo.total}}</p></div></div></div>"
  );

}]);
