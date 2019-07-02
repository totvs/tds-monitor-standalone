// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require('electron');

window.ipcRenderer = ipcRenderer;
window.languageClient = require('@totvs/tds-languageclient').TdsLanguageClient.instance();

window.addEventListener('DOMContentLoaded', () => {
	for (const versionType of ['chrome', 'electron', 'node']) {
		document.getElementById(`${versionType}-version`).innerText = process.versions[versionType];
	}
});
