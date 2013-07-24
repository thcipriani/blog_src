module.exports = function(grunt) {
    grunt.initConfig({
        watch: {
            files: ['sass/*.scss', 'index.html', '*.html'],
            tasks: ['sass:dev', 'jekyll:dev']
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
                dest: 'dev',
            }
        },

        sass: {
            dev: {
                files: {
                    'styles/gallery.css': 'sass/gallery.scss'
                }
            }
        }
    });

    grunt.registerTask('default', ['sass:dev', 'jekyll:dev']);

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-jekyll');
    grunt.loadNpmTasks('grunt-reload');
}