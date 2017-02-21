module.exports = function(grunt){
	//載入外掛
	[
		'grunt-cafe-mocha',
		'grunt-contrib-jshint',
		'grunt-exec',
	].forEach(function(task){
		grunt.loadNpmTasks(task);
	});

	//設置外掛
	grunt.initConfig({
		cafemocha: {
			all: {src: 'qa/tests-*.js', options: {ui: 'tdd'},}
		},
		jshint: {
			app: ['meadowlark.js', 'public/js/**/*.js', 'lib/**/*.js'],
			qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js'],
		},
		exec: {
			linkchecker: {cmd: 'linkchecker http://localhost:3000'}
		},
	});

	//註冊工作
	grunt.registerTask('default', ['cafemocha', 'jshint', 'exec']);
	//ff
};

