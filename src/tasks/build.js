'use strict';

let path = require('path'),
	Q = require('q'),
	builder = require("electron-builder"),
	Platform = builder.Platform,
	Arch = builder.Arch;

module.exports = function(gulp, plugins, basedir, argv) {
	let pkg = require(path.join(basedir, 'package.json')),
		finalName = 'monitor-electron',
		channel = 'latest';

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
		let identifier = `${os}-${bits}`,
			targets = ['dir'],
			arch = ((bits === 64) ? 'x64' : 'x86'),
			builderArch = ((bits === 64) ? 'x64' : 'ia32');

		if (argv.targets) {
			targets = argv.targets.split(',');
		}

		return targets.reduce((promise, target) => {
			return promise
				.then(() => {
					console.log(`Electron Builder ${identifier} ${target}`);

					let appDir = basedir,	//path.join(basedir, 'target', 'staging', identifier),
						targetDir = path.join(basedir, 'target', 'dist', identifier),
						artifactName = `${finalName}-\${version}-${os}-${arch}`;

					return builder.build({
						targets: Platform[os.toUpperCase()].createTarget(target, Arch[builderArch]),
						config: {
							//appId: pkg.config.appId,
							artifactName: `${artifactName}.\${ext}`,
							productName: 'monitor',

							publish: {
								provider: 'generic',
								url: `http://code.totvs.com:8081/repository/electron/${os}`,
								channel: channel
							},

							win: {
								icon: path.join('icons', 'application.ico'),
								publisherName: 'TOTVS S/A',
								//certificateFile: path.join(basedir, 'src', 'main', 'cert', 'TOTVS_SA.pfx'),
								//certificatePassword: 'fr@mework@123'
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
								perMachine: true
								//installerSidebar: 'totvs.bmp'
							},

							linux: {
								executableName: 'monitor',
								category: 'Office',
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

							directories: {
								output: targetDir,
								app: appDir,
								buildResources: path.join(appDir, 'src', 'main', 'resources')
							},

							asarUnpack: [
								'webapp.ini',
								'webapp'
							]
						}
					});
				});
		}, Q());
	}

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
