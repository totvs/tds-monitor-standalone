"use strict";

const path = require("path"),
	Q = require("q"),
	builder = require("electron-builder"),
	shelljs = require("shelljs"),
	fs = require("fs"),
	Platform = builder.Platform,
	Arch = builder.Arch;

module.exports = function (gulp, plugins, basedir, argv) {
	adjustPackageJson(argv);

	const pkg = require(path.join(basedir, "package.json")),
		finalName = "monitor-electron";

	let channel = "latest";

	if (/\d+\.\d+\.\d+-SNAPSHOT/gim.test(pkg.version)) {
		channel = "snapshot";
	} else if (/\d+\.\d+\.\d+-RC\d*/gim.test(pkg.version)) {
		channel = "rc";
	}

	return function () {
		let targets = getTargetPlatforms(argv),
			archs = getTargetArchs(argv);

		return archs.reduce((promise, bits) => {
			return targets.reduce((promise, os) => {
				return promise.then(() => electronBuild(os, bits));
			}, promise);
		}, Q());
	};

	function electronBuild(os, bits) {
		let env = process.env,
			identifier = `${os}-${bits}`,
			targets = ["dir"],
			arch = bits === 64 ? "x64" : "x86",
			builderArch = bits === 64 ? "x64" : "ia32",
			certificateFile = env.CERTIFICATE_FILE || env.bamboo_CERTIFICATE_FILE || null,
			certificatePassword = env.CERTIFICATE_PASSWORD || env.bamboo_CERTIFICATE_PASSWORD || null;

		let validCertificate = (certificateFile !== null);
		if ((os === 'darwin') && (certificatePassword === null)) {
			validCertificate = false;
		}

		if (validCertificate) {
			if (!shelljs.test("-e", certificateFile)) {
				validCertificate = false;
				console.error(`Certificate file not found: (${certificateFile})`);
			}
		}

		if (validCertificate) {
			const extension = path.extname(certificateFile);

			if (extension === ".cer" || extension === ".crt") {
				let originalFile = certificateFile;
				certificateFile = path.join(
					shelljs.tempdir(),
					path.basename(certificateFile, extension) + ".pfx"
				);

				console.log(`Copying ${originalFile} to ${certificateFile}`);

				shelljs.cp(originalFile, certificateFile);
			}
		}

		if (argv.installer) {
			switch (os) {
				case 'windows':
					targets = ['nsis', 'zip'];
					break;
				case 'linux':
					targets = ['deb', 'rpm', 'tar.gz'];
					break;
				case 'darwin':
					targets = ['default'];
					break;
			}
		}
		else if (argv.targets) {
			targets = argv.targets.split(",");
		}

		return targets.reduce((promise, target) => {
			return promise.then(() => {
				console.log(
					`Electron Builder ${identifier} ${target} ${argv.company.toUpperCase()}`
				);

				const appDir = basedir, //path.join(basedir, 'target', 'staging', identifier),
					targetDir = path.join(
						basedir,
						"target",
						"dist",
						identifier
					),
					artifactName = getArtifactName(argv, finalName, os, arch),
					resourcesBasedir = path.join(
						basedir,
						"src",
						"main",
						"resources"
					);

				console.log("certificateFile", certificateFile);
				console.log("certificatePassword", certificatePassword);

				return builder.build({
					targets: Platform[os.toUpperCase()].createTarget(
						target,
						Arch[builderArch]
					),
					publish: argv.publish ? "always" : "never",

					config: {
						appId: pkg.config.appId,
						artifactName: `${artifactName}.\${ext}`,
						productName: getProductName(argv),

						afterPack: async (context) => {
							const bin = path.join(
									"node_modules",
									"@totvs",
									"tds-monitor-frontend",
									"node_modules",
									"@totvs",
									"tds-languageclient",
									"node_modules",
									"@totvs",
									"tds-ls",
									"bin"
								),
								intermediate = path.join(
									"target",
									"dist",
									identifier,
									"*-unpacked",
									"resources",
									"app.asar.unpacked"
								),
								target = path.join(basedir, intermediate, bin);

							shelljs.rm("-rf", target);
						},

						afterSign: path.join(
							resourcesBasedir,
							"scripts",
							"notarize.js"
						),

						publish: {
							provider: "github",
							token:
								env.GITHUB_TOKEN ||
								env.bamboo_GITHUB_TOKEN ||
								null,
						},

						win: {
							sign: validCertificate ? path.join(resourcesBasedir, "scripts", "sign-windows.js") : null,
							icon: path.join(
								"icons",
								argv.company,
								"application.ico"
							),
							publisherName: [
								getPublisherName(argv),
								getPublisherName(argv),
								getPublisherName(argv),
							],
							certificateFile: certificateFile,
							certificatePassword: certificatePassword,
							signingHashAlgorithms: ["sha1"],
						},
						msi: {
							perMachine: true,
						},
						nsis: {
							artifactName: `${artifactName}.setup.\${ext}`,
							allowToChangeInstallationDirectory: true,
							//displayLanguageSelector: true,
							installerHeaderIcon: path.join(
								"icons",
								argv.company,
								"application.ico"
							),
							installerLanguages: [
								"pt_BR",
								"es_ES",
								"en_US",
								"ru_RU",
							],
							oneClick: false,
							perMachine: true,
							uninstallDisplayName: getDisplayName(argv),

							//installerSidebar: 'totvs.bmp'
						},
						linux: {
							icon: path.join("icons", argv.company),
							executableName: "monitor",
							category: "System",
							desktop: {
								Name: getDisplayName(argv),
								Type: "Application",
								Icon: path.join(
									"icons",
									argv.company,
									"application.ico"
								),
								Keywords: `${argv.company.toUpperCase()};Protheus;Monitor`,
							},
							maintainer: `${getPublisherName(argv)}`,
							vendor: `${getPublisherName(argv)}`,
						},
						deb: {
							compression: "gz",
						},
						rpm: {
							compression: "bzip2",
						},

						mac: {
							//forceCodeSigning: false
							icon: path.join("icons", argv.company),
							cscLink: certificateFile,
							cscKeyPassword: certificatePassword,
							identity:
								env.APPLE_ID_IDENTITY ||
								env.bamboo_APPLE_ID_IDENTITY ||
								null,
							hardenedRuntime: true,
							gatekeeperAssess: false,
							entitlements: path.join(
								resourcesBasedir,
								"plist",
								"entitlements.mac.plist"
							),
							entitlementsInherit: path.join(
								resourcesBasedir,
								"plist",
								"entitlements.mac.plist"
							),
						},
						dmg: {
							sign: false,
						},

						directories: {
							output: targetDir,
							//app: appDir,
							buildResources: path.join(
								appDir,
								"src",
								"main",
								"resources"
							),
						},

						files: [
							path.join("src", "main", "js"),
							path.join(
								"src",
								"main",
								"resources",
								"icons",
								argv.company
							),
							path.join("src", "main", "resources", "nls"),
						],

						asarUnpack: [
							`node_modules/@totvs/tds-languageclient/node_modules/@totvs/tds-ls/bin/${os}/*`,
						],
					},
				});
			});
		}, Q());
	}

	//

	function getTargetArchs(argv) {
		let archs = [];

		if (argv.x86) archs.push(32);

		if (argv.x64) archs.push(64);

		if (archs.length === 0) archs.push(64);

		return archs;
	}

	function getPublisherName(argv) {
		return argv.company == "totvs" ? "TOTVS S.A." : "National Platform";
	}

	function getProductName(argv) {
		return `monitor-electron-${argv.company}`;
	}

	function getArtifactName(argv, finalName, os, arch) {
		const company = argv.company;

		return `${finalName}-${
			company === "totvs" ? "" : `${company}-`
		}\${version}-${os}-${arch}`;
	}

	function getDisplayName(argv) {
		return `${argv.company.toUpperCase()} Monitor`;
	}

	function getTargetPlatforms(argv) {
		let targets = [];

		if (argv.windows) targets.push("windows");

		if (argv.linux) targets.push("linux");

		if (argv.mac) targets.push("mac");

		if (targets.length === 0) targets.push(getCurrentPlatform());

		return targets;
	}

	function getCurrentPlatform() {
		switch (process.platform) {
			case "win32":
				return "windows";
			case "darwin":
				return "mac";
			default:
				return process.platform;
		}
	}

	function adjustPackageJson(argv) {
		const pkgFile = path.join(basedir, "package.json");
		const pkg = require(pkgFile);

		if (argv.company && argv.company != "totvs") {
			const oldId = pkg.config.appId;
			const oldAuthor = pkg.author;

			pkg.config.appId = pkg.config.appId.replace(
				/totvs/gi,
				argv.company
			);
			pkg.author = pkg.author.replace(
				/totvs/gi,
				argv.company.toUpperCase()
			);

			fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));

			console.error("==================================================");
			console.error("--------------------------------------------------");
			console.error("A T E N Ç Ã O");
			console.error(
				"\tRECOMENDA-SE NÃO ENVIAR A MODIFICAÇÂO PARA O REPOSITÓRIO"
			);
			console.error(`\tArquivo ${pkgFile} modificado.`);
			console.error("\tAs chaves abaixo foram modificadas:");
			console.error(`\t\tconfig.appId = ${oldId} -> ${pkg.config.appId}`);
			console.error(`\t\tauthor       = ${oldAuthor} -> ${pkg.author}`);
			console.error("--------------------------------------------------");
			console.error("==================================================");
		}
	}
};
