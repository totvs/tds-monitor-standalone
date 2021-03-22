'use strict';

let gulp = require('gulp'),
	shelljs = require('shelljs'),
	path = require('path'),
	yargs = require('yargs');

let tasksDir = path.join(__dirname, 'src', 'tasks'),
	tasks = shelljs.ls(tasksDir),
	plugins = {},
	argv = yargs
		.options('x64', {
			alias: ['6', '64', 'amd64'],
			describe: 'Aciona build 64 bits',
			type: 'boolean',
			default: false
		})
		.options('x86', {
			alias: ['3', '32', 'x32', 'win32', 'ia32'],
			describe: 'Aciona build 32 bits',
			type: 'boolean',
			default: false
		})
		.options('windows', {
			alias: ['w', 'win'],
			describe: 'Aciona build Windows',
			type: 'boolean',
			default: false
		})
		.options('linux', {
			alias: ['l', 'lin'],
			describe: 'Aciona build Linux',
			type: 'boolean',
			default: false
		})
		.options('mac', {
			alias: ['m', 'osx', 'macosx'],
			describe: 'Aciona build MacOS',
			type: 'boolean',
			default: false
		})
		.argv;

tasks.forEach((filename) => {
	let taskname = path.basename(filename, '.js'),
		taskfile = path.join(tasksDir, filename),
		taskaction = require(taskfile)(gulp, plugins, __dirname, argv);

	gulp.task(taskname, taskaction);
});

gulp.task(
  "export-i18n",
  gulp.series(function (done) {
    return gulp
      .src([
        "main/resources/nls/nls.es.json",
        "main/resources/nls/nls.pt-br.json",
        "main/resources/nls/nls.ru.json",
      ])
      .pipe(nls.createXlfFiles("tds-monitor-standalone", "tds-monitor-standalone"))
      .pipe(gulp.dest(path.join("../tds-monitor-standalone-export")))
      .on("end", () => done());
  })
);

gulp.task("i18n-import", (done) => {
  return es.merge(
    languages.map((language) => {
      const id = language.transifexId || language.id;
      log(`Processing ${id}`);
      return gulp
        .src([`../tds-monitor-standalone-import/tds-monitor-standalone/tds-monitor-standalone${id}.xlf`])
        .pipe(nls.prepareJsonFiles())
        .pipe(gulp.dest(path.join("./main/resources/", language.folderName)))
        .on("end", () => done());
    })
  );
});
