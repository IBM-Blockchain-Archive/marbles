var gulp = require('gulp');
var eslint = require('gulp-eslint');

gulp.task('lint', function () {
	return gulp.src(['**/*.js', '!node_modules/**', '!docs/**', '!coverage/**', '!tmp/**'])
		.pipe(eslint(
			{
				env: ['es6', 'node'],
				extends: 'eslint:recommended',
				parserOptions: {
					sourceType: 'module'
				},
				rules: {
					indent: ['error', 'tab'],
					'linebreak-style': ['error', 'unix'],
					quotes: ['error', 'single'],
					semi: ['error', 'always'],
					'no-trailing-spaces': ['error']
				}
			}
		))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});
