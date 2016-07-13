//'use strict';

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
