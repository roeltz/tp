module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		uglify: {
			tp: {
				files: [{
					src: ["src/fill.js", "src/tp.js"],
					dest: "tp-<%= pkg.version %>.js"
				}]
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.registerTask("default", ["uglify"]);
};