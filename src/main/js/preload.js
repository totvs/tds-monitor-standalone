// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer, remote } = require('electron');
const { getCurrentWindow } = remote;
const fs = require('fs');
const path = require('path');
const { homedir } = require('./util');

let mainWindow = getCurrentWindow(),
	pkg = require('../../../package.json');

window.ipcRenderer = ipcRenderer;
window.languageClient = require('@totvs/tds-languageclient').TdsLanguageClient.instance();
window.versions = {
	'main': pkg.version,
	'@totvs/tds-languageclient': pkg.dependencies['@totvs/tds-languageclient'],
	'@totvs/tds-monitor-frontend': pkg.dependencies['@totvs/tds-monitor-frontend']
}

window.reload = () => {
	mainWindow.webContents.reloadIgnoringCache();
};

window.toggleDevTools = () => {
	mainWindow.webContents.toggleDevTools();
};

window.maximize = () => {
	mainWindow.maximize();
};

window.restore = () => {
	mainWindow.restore();
};

window.minimize = () => {
	mainWindow.minimize();
};

window.close = () => {
	mainWindow.close();
};

window.addEventListener('keydown', (event) => {
	if (event.ctrlKey && event.altKey) {
		switch (event.key) {
			case 'F5':
				window.reload();
				break;
			case 'F12':
				window.toggleDevTools();
				break;
		}
	}
});

mainWindow.on('maximize', () => {
	window.dispatchEvent(new Event('maximized'));
});

mainWindow.on('unmaximize', () => {
	window.dispatchEvent(new Event('restored'));
});

const settingsDir = homedir();
if (!fs.existsSync(settingsDir)) {
	fs.mkdirSync(settingsDir, { recursive: true });
}

const settingsFile = path.join(settingsDir, 'settings.json');
if (!fs.existsSync(settingsFile)) {
	let content = window.localStorage.getItem("settings");
	if (!content) {
		content = '{}';
	}

	fs.writeFileSync(settingsFile, content, { encoding: 'utf8' });
}

window.storage = {
	get: function() {
		try {
			let data = fs.readFileSync(settingsFile, { encoding: 'utf8' });
			return JSON.parse(data);
		}
		catch (ex) {
			return {};
		}
	},

	set: function(data) {
		let content = JSON.stringify(data, null, 2);

		fs.writeFileSync(settingsFile, content, { encoding: 'utf8' });
	}

}
