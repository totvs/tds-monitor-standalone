const path = require('path'),
	pkg = require('../../../package.json');

function homedir() {
	var targetDir;

	switch (process.platform) {
		case 'darwin':
			targetDir = path.join(process.env.HOME, 'Library', 'Preferences', pkg.name);
			break;
		case 'win32':
			targetDir = path.join(process.env.APPDATA, pkg.name);
			break;
		default:
			targetDir = path.join(os.homedir(), '.' + pkg.name);
			break;
	}

	return targetDir;
}


module.exports = {
	homedir
};
