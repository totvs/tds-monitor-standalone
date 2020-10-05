const path = require('path'),
	child_process = require('child_process');

/** @param configuration {CustomWindowsSignTaskConfiguration} */
exports.default = async (configuration) => {
	let cmd = signtoolExe();
	let args = configuration.computeSignToolArgs(true);

	let pos = args.indexOf('sign');
	args.splice(pos + 1, 0, '/csp', 'Dinamo HSM Cryptographic Provider', '/kc', 'CodeSigning', '/v');

	return new Promise((resolve, reject) => {
		console.log('SPAWN', `${cmd} ${args.join(' ')}`);

		try {
			let out = child_process.spawnSync(cmd, args, {
				stdio: 'inherit',
				env: process.env
			});

			if (out.status === 2) {
				console.warn("Exited with warnings", out);
			}
			else if (out.status === 1) {
				reject(out);
			}

			resolve();
		}
		catch (error) {
			reject(error);
		}
	});

}

function signtoolExe() {
	if (signtoolExe.result)
		return signtoolExe.result;

	let dir = path.dirname(require.resolve('signtool/package.json'));

	switch (process.arch) {
		case "ia32":
			return (signtoolExe.result = path.join(dir, "signtool", "x86", "signtool.exe"));
		case "x64":
			return (signtoolExe.result = path.join(dir, "signtool", "x64", "signtool.exe"));
		case "arm":
		default:
			throw new Error("Signtool is not supported in this environment");
	}
}
