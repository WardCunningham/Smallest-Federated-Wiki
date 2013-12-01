module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    browserify: {
      client: {
        src: ['client.coffee'],
        dest: 'client.js',
        options: {
          transform: ['coffeeify'],
          debug: true
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
      plugins: {
        expand: true,
        src: ['plugins/**/*.coffee'],
        ext: '.js'
      } 
    },

    watch: {
      all: {
        files: [
          '<%= browserify.testClient.src %>',
          '<%= browserify.client.src %>',
          '<%= coffee.plugins.src %>',
          'lib/**/*.coffee'
        ],
        tasks: ['browserify', 'coffee']
      }
    }
  });

  grunt.registerTask('build', ['coffee', 'browserify']);
  grunt.registerTask('default', ['build']);

};
