// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');
const path = require('path');

const argv = require('yargs') // eslint-disable-line
    .options('logging', {
        alias: ['l'],
        describe: 'Enable LS logging',
        type: 'boolean',
        default: false
    })
    .options('dev', {
        alias: ['d'],
        describe: 'Open with DevTools',
        type: 'boolean',
        default: false
    })
    .argv;
require('@totvs/tds-languageclient').TdsLanguageClient.instance({ logging: argv.logging });

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		title: 'TOTVS Monitor',
		icon: path.join(__dirname, '..', 'resources', 'icons', '1024x1024.png'),

		//titleBarStyle: "hidden",
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			preload: path.join(__dirname, 'preload.js')
		}
	});

	// Para remover o menu:
	//mainWindow.removeMenu();

	/*
	let frontend = require.resolve('@totvs/tds-monitor-frontend/package.json'),
		file = path.join(path.dirname(frontend), 'target', 'index.html');

	mainWindow.loadFile(file);

	*/

	mainWindow.loadFile(require.resolve('@totvs/tds-monitor-frontend'));

	// and load the index.html of the app.
	//mainWindow.loadFile(path.join(__dirname, 'index.html'));

	// Open the DevTools.
	if (argv.dev) {
		mainWindow.webContents.openDevTools()
	}

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin')
		app.quit();
});

app.on('activate', function() {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null)
		createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
