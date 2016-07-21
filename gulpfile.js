///// Gulp Dependencies /////
var path = require('path');
var gulp = require('gulp');
var	sass = require('gulp-sass');
var concat = require('gulp-concat');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var bust = require('gulp-buster');
var spawn = require('child_process').spawn;
var node;

////// Build Tasks ///////
gulp.task('build-sass', function () {
	gulp.src(path.join(__dirname, '/scss/*.scss'))
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest(path.join(__dirname,'/scss/temp')))			//build them here first
		.pipe(concat('main.css'))									//concat them all
		.pipe(gulp.dest(path.join(__dirname, '/public/css')))
		.pipe(cleanCSS())											//minify
		.pipe(rename('main.min.css'))
		.pipe(gulp.dest(path.join(__dirname,'/public/css')))		//dump it here
		.pipe(rename('singlecsshash'))
		.pipe(bust({fileName: 'busters_css.json'}))					//cache bust
		.pipe(gulp.dest('.'));										//dump busters_css.json
});

gulp.task('build-js-hash', function () {
	gulp.src(path.join(__dirname,'/public/js/*.js'))
		.pipe(concat('singlejshash'))								//concat them all
		.pipe(bust({fileName: 'busters_js.json'}))					//cache bust
		.pipe(gulp.dest('.'));										//dump busters_js.json
});

////// Run Server Task ///////
gulp.task('server', function() {
	if(node) node.kill();
	node = spawn('node', ['app.js'], {stdio: 'inherit'});			//command, file, options
});

////// Watch Tasks //////
gulp.task('watch-sass', ['build-sass'], function () {
	gulp.watch(path.join(__dirname, '/scss/*.scss'), ['build-sass']);
});

gulp.task('watch-js', ['build-js-hash'], function () {
	gulp.watch(path.join(__dirname,'/public/js/*.js'), ['build-js-hash']);
});

gulp.task('watch-server', ['server'], function () {
	gulp.watch(path.join(__dirname, '/routes/**/*.js'), ['server']);
	gulp.watch([path.join(__dirname, '/utils/**/*.js')], ['server']);
	gulp.watch(path.join(__dirname, '/setup.js'), ['server']);
	gulp.watch(path.join(__dirname, '/app.js'), ['server']);
});

////// Tasks //////
gulp.task('default', ['watch-sass', 'watch-js', 'watch-server']);
