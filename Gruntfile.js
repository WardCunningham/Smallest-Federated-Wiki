module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    browserify: {
      client: {
        src: ['client/client.coffee'],
        dest: 'client/client.js',
        options: {
          transform: ['coffeeify']
        }
      },
      testClient: {
        src: ['client/testclient.coffee', 'client/plugins/*/test.coffee'],
        dest: 'client/test/testclient.js',
        options: {
          transform: ['coffeeify'],
          debug: true
        }
      }
    },

    coffee: {
      plugins: {
        expand: true,
        src: ['client/plugins/**/*.coffee'],
        ext: '.js'
      } 
    },

    watch: {
      all: {
        files: [
          '<%= browserify.testClient.src %>',
          '<%= browserify.client.src %>',
          '<%= coffee.plugins.src %>',
          'client/lib/**/*.coffee'
        ],
        tasks: ['browserify', 'coffee']
      }
    }
  });

  grunt.registerTask('build', ['browserify', 'coffee']);
  grunt.registerTask('default', ['build']);

};
