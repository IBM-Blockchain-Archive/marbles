///// Gulp Dependencies /////
var path = require('path');
var gulp = require('gulp');
var	sass = require('gulp-sass');
var concat = require('gulp-concat');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var bust = require('gulp-buster');
var spawn = require('child_process').spawn;
var fs = require('fs');
var node, env = process.env;

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
	node = spawn('node', ['app.js'], {env: env, stdio: 'inherit'});			//command, file, options
});

////// Watch Tasks //////
gulp.task('watch-sass', ['build-sass'], function () {
	gulp.watch(path.join(__dirname, '/scss/*.scss'), ['build-sass', 'server']);
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
gulp.task('default', ['watch-js', 'watch-sass', 'watch-server']);
gulp.task('united_marbles', ['start_mtc1', 'default']);
gulp.task('marble_market', ['start_mtc2', 'default']);
gulp.task('emarbles', ['start_mtc3', 'default']);

gulp.task('init_united_marbles', ['init_mtc1', 'start_mtc1', 'default']);
gulp.task('init_marble_market', ['init_mtc2', 'start_mtc2', 'default']);
gulp.task('init_emarbles', ['init_mtc3', 'start_mtc3', 'default']);

// MTC Member 1
var build_users1 = ['amy', 'alice', 'amber'];
gulp.task('init_mtc1', function () {
	env['build_marbles_users'] = JSON.stringify(build_users1);		//copy to environmental vars
});
gulp.task('start_mtc1', function () {
	console.log('\n[International Marbles Trading Consortium] - Member "United Marbles"\n');
	env['marbles_users'] = JSON.stringify(build_users1);				//copy to environmental vars
	env['marble_company'] = 'United Marbles';
	env['marble_port'] = 3000;
	var color_theme = fs.readFileSync('./scss/color_theme01.scss').toString();
	fs.writeFileSync('./scss/color_theme.scss', color_theme);
	gulp.task('temp', ['build-sass']);
});

// MTC Member 2
var build_users2 = ['bob', 'bill'];
gulp.task('init_mtc2', function () {
	env['build_marbles_users'] = JSON.stringify(build_users2);		//copy to environmental vars
});
gulp.task('start_mtc2', function () {
	console.log('\n[International Marbles Trading Consortium] - Member "Marble Market"\n');
	env['marbles_users'] = JSON.stringify(build_users2);				//copy to environmental vars
	env['marble_company'] = 'Marble Market';
	env['marble_port'] = 3001;
	var color_theme = fs.readFileSync('./scss/color_theme02.scss').toString();
	fs.writeFileSync('./scss/color_theme.scss', color_theme);
	gulp.task('temp', ['build-sass']);
});

// MTC Member 3
var build_users3 = ['cliff', 'cody'];
gulp.task('init_mtc3', function () {
	env['build_marbles_users'] = JSON.stringify(build_users3);		//copy to environmental vars
});
gulp.task('start_mtc3', function () {
	console.log('\n[International Marbles Trading Consortium] - Member "eMarbles"\n');
	env['marbles_users'] = JSON.stringify(build_users3);				//copy to environmental vars
	env['marble_company'] = 'eMarbles';
	env['marble_port'] = 3002;
	var color_theme = fs.readFileSync('./scss/color_theme03.scss').toString();
	fs.writeFileSync('./scss/color_theme.scss', color_theme);
	gulp.task('temp', ['build-sass']);
});
