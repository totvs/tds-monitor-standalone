"use strict";

const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context;
	if (electronPlatformName !== 'darwin') {
		return;
	}

	const appleIdMail = process.env.APPLE_ID_EMAIL || process.env.bamboo_APPLE_ID_EMAIL,
		appleIdPassword = process.env.APPLE_ID_PASSWORD || process.env.bamboo_APPLE_ID_PASSWORD;

	if ((!appleIdMail) || (!appleIdPassword)) {
		console.log('Skipping notarization process. Environment variables not set.');
		return;
	}

	const simbol = ['-', '\\', '|', '/', '-', '\\', '|', '/'];

	let pos = 0,
		handle = setInterval(() => {
			process.stdout.write(`${simbol[pos]}\r`);

			pos++;
			if (pos >= simbol.length)
				pos = 0;
		}, 60000);

	const appName = context.packager.appInfo.productFilename,
		appId = context.packager.appInfo.info._metadata.config.appId;

	console.log('Start notarizing...');

	const result = await notarize({
		appBundleId: appId,
		appPath: `${appOutDir}/${appName}.app`,
		appleId: appleIdMail,
		appleIdPassword: appleIdPassword
	});

	clearInterval(handle);
	handle = null;

	console.log('Done!');

	return result;
};
