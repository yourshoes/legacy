'use strict';


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

/*ng-class="{active: $routeSegment.startsWith('s1')}*/