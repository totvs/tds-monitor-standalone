// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer, remote } = require('electron');
const { getCurrentWindow } = remote;

let mainWindow = getCurrentWindow();

window.ipcRenderer = ipcRenderer;
window.languageClient = require('@totvs/tds-languageclient').TdsLanguageClient.instance();

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
	switch (event.key) {
		case 'F5':
			window.reload();
			break;
		case 'F12':
			window.toggleDevTools();
			break;
	}
});

mainWindow.on('maximize', () => {
	window.dispatchEvent(new Event('maximized'));
});

mainWindow.on('unmaximize', () => {
	window.dispatchEvent(new Event('restored'));
});




// Load and save application settings:

if (!window.localStorage.getItem("settings")) {
	window.localStorage.setItem("settings", `{
		"servers": []
	}`);
}

mainWindow.on('close', function() {
	mainWindow.webContents.executeJavaScript(`window.localStorage.getItem("settings");`)
		.then((storage) => {
			console.log(storage);
			//let content = JSON.stringify(storage, null, 2);

			//shelljs.ShellString(content).to(storageFile);
		});
});
