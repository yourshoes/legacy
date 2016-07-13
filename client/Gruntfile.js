module.exports = function(grunt) {
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    ngtemplates:  
    {
      app: 
      {
        cwd:'app',
        src: 'partials/**.html',
        dest: 'app/js/templates.js',
        options:    
        {
          module:'kalzate',
          url: function(url){return '/static/'+url;},
          htmlmin:
          { 
          
              collapseBooleanAttributes:      true,
              collapseWhitespace:             true,
              removeAttributeQuotes:          true,
              removeComments:                 true,
              removeEmptyAttributes:          true,
              removeRedundantAttributes:      true,
              removeScriptTypeAttributes:     true,
              removeStyleLinkTypeAttributes:  true 
          }
        }
      }
    },
    concat: {
      options: {
        // define a string to put between each file in the concatenated output
        separator: ';'
      },
      dist: {
        // the files to concatenate
        src: ['app/js/config.js', 'app/js/app.js', 'app/js/services.js','app/js/controllers.js','app/js/filters.js','app/js/directives.js', 'app/js/templates.js'],
        // the location of the resulting JS file
        dest: 'app/dist/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        // the banner is inserted at the top of the output
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'app/dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    }//,

    //jshint: {
      // define the files to lint
      //files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      // configure JSHint (documented at http://www.jshint.com/docs/)
      //options: {
          // more options here if you want to override JSHint defaults
          /*"curly": true,
          "eqnull": true,
          "eqeqeq": true,
          "undef": true,
        globals: {
          jQuery: true,
          console: true,
          module: true
        }*/
      //}
    //},
    /*
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
    */
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  //grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-angular-templates');

  //grunt.registerTask('test', ['jshint']);
  //grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
  grunt.registerTask('default', ['ngtemplates', 'concat', 'uglify']);
};
