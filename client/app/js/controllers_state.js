/* Controllers */

angular.module('kalzate.controllers', [])
.controller('LoginCtrl', ['$rootScope', '$scope', '$state', '$window', 'Auth', 
	
	function ($rootScope, $scope, $state, $window, Auth) 
	{
    	$scope.error = false;
    	$scope.login = function() {

            Auth.login({
                username: $scope.username,
                password: $scope.password
            },function (res) {
                $scope.error = false;
                $state.go($rootScope.transition || 'index');
                //$location.path($rootScope.transition || '/');
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
.controller('FooterCtrl', ['$scope', '$location', 'Auth', '$modal', function ($scope, $location, Auth, $modal) {
    
    $scope.user = Auth.user;
    //$scope.userRoles = Auth.userRoles;
    //$scope.accessLevels = Auth.accessLevels;

    $scope.logout = function() {
        Auth.logout(function() {
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
.controller('ShoesCtrl', ['$scope', '$http', '$cookieStore', '$location', '$window', 'Colors', '$modal',
    function ($scope, $http, $cookieStore, $location, $window, Colors, $modal) {

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
                color: $scope.color['color'], 
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

            alert('Oh No!, este zapato ya ha sido añadido, consulta al administrador con este codigo: OnemoreShoeCtrl-addShoe');
        
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
            $scope.ticketTotal += $scope.oldTicketInfo.total;
        }

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

        $http
        .post('/api/ticket/new')
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
    $scope.complements['references'] = ['BOLSOS','PAÑUELOS','ANILLOS','COLLARES'];
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
        Printer.print({cut:true, content:$scope.tickets.items[index]['print'], openCashDrawer:false}, function(err){

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

        dateFrom:'',
        dateTo:'',
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

        if($scope.box.dateFrom != '')
        {
            info.dateFrom = $scope.box.dateFrom;
        }
        else
        {
            info.dateFrom = (new Date()).toLocaleDateString();
        }

        if($scope.box.dateTo != '')
        {
            info.dateTo = $scope.box.dateTo;
        }
        else
        {
            info.dateTo = (new Date()).toLocaleDateString();
        }

        $http
        .post('/api/box/get',info)
        .success(function (data) 
        {
            $scope.box.progress = false;

            if(!data.box.length)
            {
                $scope.box.total = -1;
                return
            }

            $scope.box.result = data.box;
            $scope.box.total = data.total;
        })
        .error(function(){
            $scope.box.progress = false;
        });
    }

    $scope.box.applyInitCash = function()
    {
        if($scope.box.total > 0)
        {
            $scope.box.total -= $scope.box.total_stack;
            $scope.box.total_stack = $scope.box.initialCash;
            $scope.box.total += $scope.box.initialCash;
        }
    }

    $scope.box.printToPDF = function()
    {
        
    }

    $scope.box.printToTicket = function()
    {
        
    }

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
    
    var oldDate;
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
            
            $scope.returnTicketTotal = ticket.overview.total;
            $scope.returnTicketTax = ticket.overview.tax;
            $scope.returnTicketDiscount = ticket.overview.discount;
            $scope.returnProducts = ticket.products;
            oldDate = ticket['date_end'];

            for(var i= 0;i<$scope.returnProducts.length;i++)
            {
                $scope.returnProducts[i]['totalQuantity'] = $scope.returnProducts[i]['quantity'];
            }

            ticket.overview.total = 0;
            $scope.$parent.setOldTicket(ticket,'returned');

            $scope.$parent.progress = false;
        });
    });

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

            subtotal = -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
        }
        else
        {
            productPromise = {

                '_id':$scope.returnProducts[i]['_id'],
                'quantity':0,
                'qa':-$scope.returnProducts[i]['quantity']
            };

            subtotal = ($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
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
                $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                return;
            }

            return $http
            .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
            .success(function (response) 
            {
                $scope.returnProducts[i]['quantity']--;
                $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;

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
                $scope.$parent.oldTicketInfo.total += ($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.returnProducts[i]['quantity']--;
                $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                return;
            }

            return $http
            .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
            .success(function (response) 
            {
                $scope.$parent.oldTicketInfo.total += ($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.returnProducts[i]['quantity']--;
                $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;

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
                $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                return;
            }

            return $http
            .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
            .success(function (response) 
            {
                $scope.returnProducts[i]['quantity']++;
                $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;

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
                $scope.$parent.oldTicketInfo.total += ($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.returnProducts[i]['quantity']++;
                $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;
                return;
            }

            return $http
            .post('/api/ticket/update',{'_id':$scope.ticketId, 'product':productPromise})
            .success(function (response) 
            {
                $scope.$parent.oldTicketInfo.total += ($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.returnProducts[i]['quantity']++;
                $scope.$parent.oldTicketInfo.total += -($scope.returnProducts[i]['price']*$scope.returnProducts[i]['quantity']);
                $scope.$parent.applyRate();
                $scope.returnProducts[i]['returned'] = true;

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
                if($scope.returnProducts[i]['quantity'] == $scope.returnProducts[i]['totalQuantity'])
                {
                    products['returned'].push($scope.returnProducts[i]);
                }
                else
                {
                    //angular.extend(mixedA,$scope.returnProducts[i]);
                    angular.extend(mixedB, $scope.returnProducts[i]);

                    mixedB.quantity = $scope.returnProducts[i].totalQuantity - $scope.returnProducts[i].quantity;

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
;