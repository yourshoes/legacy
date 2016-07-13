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
      templateUrl: '/static/partials/tickets.html',
      controller: 'TicketsCtrl',
      access: access.employee
    })
    .state('tickets.return', {
      url: "/return/:code",
      templateUrl: '/static/partials/tickets_return.html',
      controller: 'TicketsReturnCtrl',
      access: access.employee
    })
    .state('tickets.reserve', {
      url: "/reservas/:code",
      templateUrl: '/static/partials/tickets_reserve.html',
      controller: 'TicketsReserveCtrl',
      access: access.employee
    })
    .state('error', {
      url: "/404",
      templateUrl: '/static/partials/404.html', 
      access: access.public
    });

    $urlRouterProvider.otherwise("/404");

    $locationProvider.html5Mode(true);

    var interceptor = ['$state', '$q', function ($state, $q)
    {
        
        function success(response) 
        {
            return response;
        }

        function error(response) 
        {
            if(response.status === 401) 
            {
                //$location.path('/login');
                $state.go('login');
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
.run(['$rootScope', '$state', 'Auth', function ($rootScope, $state, Auth){

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
                //$rootScope.transition = $location.path();
                $rootScope.transition = $state.current['name'];
                //$location.path('/login');
                $state.go('login');
            } 
            //If user is already logged in and try to enter to login page
           else
           {
                //$location.path('/');
                $state.go('index');
                //console.log('El path:',$location.path());
           }
        }
    });

}]);

/*ng-class="{active: $routeSegment.startsWith('s1')}*/