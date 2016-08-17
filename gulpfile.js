const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const exec = require('gulp-exec');
const eslint = require('gulp-eslint');
const esdoc = require('gulp-esdoc');
const del = require('del');

// Build scripts
gulp.task('build', () =>
	gulp.src('src/**/*.js')
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('lib'))
);

// Clean built scripts
gulp.task('clean', () => del('lib/**'));

// Clean then build
gulp.task('rebuild', gulp.series('clean', 'build'));

// Lint scripts
gulp.task('lint', () =>
	gulp.src('src/**/*.js')
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError())
);

// Build documentation
gulp.task('docs', () =>
	gulp.src(['./src/**/*.js'])
		.pipe(esdoc())
);

// Commit & tag with Git and publish to NPM
gulp.task('publish', gulp.parallel('lint', gulp.series('rebuild', () => {
	const version = require('./package.json').version;
	return gulp.src('.')
		.pipe(exec(`git commit -am "Prepare ${version} release"`))
		.pipe(exec(`git tag v${version}`))
		.pipe(exec(`git push origin : v${version}`))
		.pipe(exec('npm publish'));
})));

gulp.task('default', gulp.parallel('lint', 'rebuild'));
