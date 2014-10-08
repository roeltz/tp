module.exports = function(grunt) {

	grunt.initConfig({
		uglify: {
			tp: {
				files: {
					'tp.js': [
						'src/fill.js',
						'src/tp.js'
					]
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.registerTask('default', ['uglify']);
};