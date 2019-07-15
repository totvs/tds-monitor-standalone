// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer, remote } = require('electron');
const { getCurrentWindow } = remote;

window.ipcRenderer = ipcRenderer;
window.languageClient = require('@totvs/tds-languageclient').TdsLanguageClient.instance();

if (!window.localStorage.getItem("settings")) {
	window.localStorage.setItem("settings", `{
		"servers": []
	}`);
}

window.reload = () => {
	getCurrentWindow().webContents.reloadIgnoringCache();
};

window.toggleDevTools = () => {
	getCurrentWindow().webContents.toggleDevTools();
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
