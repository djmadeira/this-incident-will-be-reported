module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      default: {
        options: {
          banner: '/* This Incident Will Be Reported - Copyright DJ Madeira. You are free to use this code for whatever you want, as long as you give credit, and you share what you make with others. Official license jazz: https://creativecommons.org/licenses/by-sa/3.0/. Uncompressed source, for your edification (no polyfills for non-web component browsers): djmadeira.com/cmd/cmd.js */'
        },
        files: {
          'cmd.min.js' : 'cmd.min.js'
        }
      }
    },
    browserify: {
      default: {
        files: {
          'cmd.min.js': 'cmd.js'
        }
      }
    },
    watch: {
      default: {
        files: ['*.{js,scss}', '!*.min.{js,scss}'],
        tasks: ['default']
      }
    },
    sass: {
      default: {
        options: {
          sourcemap: true,
          style: 'compressed',
          banner: '/* Uncompressed source file: djmadeira.com/cmd/style.scss */'
        },
        files: {
          'style.min.css': 'style.scss'
        }
      }
    },
    libsass: {
      default: {
        options: {
          sourcemap:true,
        },
        src: 'style.scss',
        dest: 'style.min.css'
      }
    },
    autoprefixer: {
      default: {
        files: {
          'style.min.css': 'style.min.css'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-libsass');

  grunt.registerTask('default', ['browserify', /*'uglify',*/ 'libsass', 'autoprefixer']);
  grunt.registerTask('w', ['watch']);

};
