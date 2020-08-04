'use strict';

const path = require('path'),
	Q = require('q'),
	builder = require("electron-builder"),
	shelljs = require('shelljs'),
	Platform = builder.Platform,
	Arch = builder.Arch;

module.exports = function(gulp, plugins, basedir, argv) {
	const pkg = require(path.join(basedir, 'package.json')),
		finalName = 'monitor-electron';

	let channel = 'latest';

	if (/\d+\.\d+\.\d+-SNAPSHOT/igm.test(pkg.version)) {
		channel = 'snapshot';
	}
	else if (/\d+\.\d+\.\d+-RC\d*/igm.test(pkg.version)) {
		channel = 'rc';
	}

	return function() {
		let targets = getTargetPlatforms(argv),
			archs = getTargetArchs(argv);

		return archs.reduce((promise, bits) => {
			return targets.reduce((promise, os) => {
				return promise
					.then(() => electronBuild(os, bits));
			}, promise);
		}, Q());
	};

	function electronBuild(os, bits) {
		let env = process.env,
			identifier = `${os}-${bits}`,
			targets = ['dir'],
			arch = ((bits === 64) ? 'x64' : 'x86'),
			builderArch = ((bits === 64) ? 'x64' : 'ia32'),
			certificateFile = env.CERTIFICATE_FILE || env.bamboo_CERTIFICATE_FILE || null,
			certificatePassword = env.CERTIFICATE_PASSWORD || env.bamboo_CERTIFICATE_PASSWORD || null;

		if ((certificateFile === null) || (certificatePassword === null)) {
			certificateFile = null;
			certificatePassword = null;
		}

		if (argv.targets) {
			targets = argv.targets.split(',');
		}

		return targets.reduce((promise, target) => {
			return promise
				.then(() => {
					console.log(`Electron Builder ${identifier} ${target}`);

					const appDir = basedir,	//path.join(basedir, 'target', 'staging', identifier),
						targetDir = path.join(basedir, 'target', 'dist', identifier),
						artifactName = `${finalName}-\${version}-${os}-${arch}`,
						resourcesBasedir = path.join(basedir, "src", "main", "resources");

					return builder.build({
						targets: Platform[os.toUpperCase()].createTarget(target, Arch[builderArch]),
						publish: argv.publish ? 'always' : 'never',

						config: {
							appId: pkg.config.appId,
							artifactName: `${artifactName}.\${ext}`,
							productName: 'totvs-monitor',

							afterPack: async (context) => {
								const bin = path.join('node_modules', '@totvs', 'tds-monitor-frontend', 'node_modules', '@totvs', 'tds-languageclient', 'node_modules', '@totvs', 'tds-ls', 'bin'),
									intermediate = path.join('target', 'dist', identifier, '*-unpacked', 'resources', 'app.asar.unpacked'),
									target = path.join(basedir, intermediate, bin);

								shelljs.rm('-rf', target);
							},

							afterSign: path.join(resourcesBasedir, "scripts", "notarize.js"),

							publish: {
								provider: 'github',
								token: env.GITHUB_TOKEN || env.bamboo_GITHUB_TOKEN || null
							},

							win: {
								icon: path.join('icons', 'application.ico'),
								publisherName: 'TOTVS S/A',
								certificateFile: certificateFile,
								certificatePassword: certificatePassword
							},
							msi: {
								perMachine: true
							},
							nsis: {
								artifactName: `${artifactName}.setup.\${ext}`,
								allowToChangeInstallationDirectory: true,
								//displayLanguageSelector: true,
								installerHeaderIcon: path.join('icons', 'application.ico'),
								installerLanguages: [
									'pt_BR', 'es_ES', 'en_US', 'ru_RU'
								],
								oneClick: false,
								perMachine: true,
								uninstallDisplayName: 'TOTVS Monitor'

								//installerSidebar: 'totvs.bmp'
							},

							linux: {
								executableName: 'monitor',
								category: 'System',
								desktop: {
									Name: 'TOTVS Monitor',
									Type: 'Application',
									Keywords: 'TOTVS;Protheus;Monitor'
								},
								maintainer: "TOTVS",
								vendor: "TOTVS"
							},
							deb: {
								compression: "gz"
							},
							rpm: {
								compression: "bzip2"
							},

							mac: {
								//forceCodeSigning: false

								cscLink: certificateFile,
								cscKeyPassword: certificatePassword,

								identity: env.APPLE_ID_IDENTITY || env.bamboo_APPLE_ID_IDENTITY || null,
								hardenedRuntime: true,
								gatekeeperAssess: false,
								entitlements: path.join(resourcesBasedir, "plist", "entitlements.mac.plist"),
								entitlementsInherit: path.join(resourcesBasedir, "plist", "entitlements.mac.plist")
							},
							dmg: {
								sign: false
							},

							directories: {
								output: targetDir,
								//app: appDir,
								buildResources: path.join(appDir, 'src', 'main', 'resources')
							},

							files: [
								path.join('src', 'main', 'js'),
								path.join('src', 'main', 'resources', 'icons')
							],

							asarUnpack: [
								`node_modules/@totvs/tds-languageclient/node_modules/@totvs/tds-ls/bin/${os}/*`
							]
						}
					});
				});
		}, Q());
	}

	//



	function getTargetArchs(argv) {
		let archs = [];

		if (argv.x86)
			archs.push(32);

		if (argv.x64)
			archs.push(64);

		if (archs.length === 0)
			archs.push(64);

		return archs;
	}


	function getTargetPlatforms(argv) {
		let targets = [];

		if (argv.windows)
			targets.push('windows');

		if (argv.linux)
			targets.push('linux');

		if (argv.mac)
			targets.push('mac');

		if (targets.length === 0)
			targets.push(getCurrentPlatform());

		return targets;
	}

	function getCurrentPlatform() {
		switch (process.platform) {
			case 'win32':
				return 'windows';
			case 'darwin':
				return 'mac';
			default:
				return process.platform;
		}
	}
};
