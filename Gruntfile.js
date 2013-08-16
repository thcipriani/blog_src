module.exports = function(grunt) {
    grunt.initConfig({
        watch: {
            files: ['sass/*.scss', 'index.html', '*.html', 'styles/*.css', '_layouts/*.html'],
            tasks: ['cssmin:css', 'jekyll:prod']
        },

        reload: {
            port: 35729,
            proxy: {
                host: 'localhost',
                port: 4000
            }
        },

        jekyll: {
            server: {
                server : true,
                server_port : 4000,
                auto : true
            },
            dev: {
                src: '.',
                dest: 'dev'
            },
            prod: {
                src: '.',
                dest: '_site'
            }
        },

        sass: {
            dev: {
                files: {
                    'styles/gallery.css': 'sass/gallery.scss'
                }
            }
        },

        cssmin: {
            css: {
                src: 'styles/main.css',
                dest: 'styles/main-min.css'
            }
        }
    });

    grunt.registerTask('default', ['cssmin:css', 'jekyll:prod']);

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-jekyll');
    grunt.loadNpmTasks('grunt-reload');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
}