'use strict';
module.exports = function (config) {
	config.set({
		basePath: '.',
		frameworks: ['mocha'],
		files: ['tests/*-tests.js'],

		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['spec'],

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,

		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['PhantomJS'],

		preprocessors: {
			'**/*.js': ['webpack']
		},

		webpack: {
			module: {
				loaders: [{
					test: require.resolve('jquery'),
					loader: 'expose-loader?jQuery!expose-loader?$'
				}],
				rules: [{
					test: /-tests\.js$/,
					exclude: /(node_modules|bower_components)/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['es2015']
						}
					}
				}]
			}
		},

		webpackMiddleware: {

			// suppress webpack warnings
			stats: 'errors-only'
		},

		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true
	});
};
