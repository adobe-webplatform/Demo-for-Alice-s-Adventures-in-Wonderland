module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        sass: {
          compile: {
            options: {
              includePaths: ['css/'],
              // outputStyle: 'expanded'
            },
            
            files: {
              'css/style.css': 'css/style.scss'
            }
          },
        },
        
        watch: {
          files: '**/*.scss',
          tasks: ['sass'],
          options: {
            nospawn: true,
            livereload: true,
          },
        }
    });
    
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    
    
    grunt.registerTask('default', ['sass']);
}