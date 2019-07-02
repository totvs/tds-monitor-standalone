'use strict';

let path = require('path'),
	shelljs = require('shelljs');

module.exports = function(gulp, plugins, basedir, argv) {
	return function(done) {
		shelljs.rm('-rf', path.join(basedir, 'target'));

		done();
	};
};
