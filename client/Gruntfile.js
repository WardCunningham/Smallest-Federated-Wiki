require('coffee-script');

module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  

  grunt.initConfig({
    browserify: {
      client: {
        src: ['client.coffee'],
        dest: 'client.js',
        options: {
          transform: ['coffeeify']
        }
      },
      testClient: {
        src: ['testclient.coffee', 'plugins/*/test.coffee'],
        dest: 'test/testclient.js',
        options: {
          transform: ['coffeeify'],
          debug: true
        }
      }
    },

    coffee: {
      experiment: {
        expand: true,
        src: ['plugins/*/*.coffee'],
        ext: '.js'
      } 
    }
  });

};