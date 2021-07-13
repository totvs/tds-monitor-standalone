"use strict";

let gulp = require("gulp"),
	shelljs = require("shelljs"),
	path = require("path"),
	yargs = require("yargs");

let tasksDir = path.join(__dirname, "src", "tasks"),
	tasks = shelljs.ls(tasksDir),
	plugins = {},
	argv = yargs
		.options("x64", {
			alias: ["6", "64", "amd64"],
			describe: "Aciona build 64 bits",
			type: "boolean",
			default: false,
		})
		.options("x86", {
			alias: ["3", "32", "x32", "win32", "ia32"],
			describe: "Aciona build 32 bits",
			type: "boolean",
			default: false,
		})
		.options("windows", {
			alias: ["w", "win"],
			describe: "Aciona build Windows",
			type: "boolean",
			default: false,
		})
		.options("linux", {
			alias: ["l", "lin"],
			describe: "Aciona build Linux",
			type: "boolean",
			default: false,
		})
		.options("mac", {
			alias: ["m", "osx", "macosx"],
			describe: "Aciona build MacOS",
			type: "boolean",
			default: false,
		}).argv;

tasks.forEach((filename) => {
	let taskname = path.basename(filename, ".js"),
		taskfile = path.join(tasksDir, filename),
		taskaction = require(taskfile)(gulp, plugins, __dirname, argv);

	gulp.task(taskname, taskaction);
});
