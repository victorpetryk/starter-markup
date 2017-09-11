// Dependencies
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const del = require('del');
const runSequence = require('run-sequence');
const browserSync = require('browser-sync').create();

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

// Configuration
const config = require('./config');

// List of vendor JavaScript libraries
let vendorJS = require('./app/scripts/vendor');

// For development purpose
let dev = true;

// Styles task
gulp.task('styles', () => {
    return gulp.src('app/styles/*.scss')
        .pipe($.plumber())
        .pipe($.if(dev, $.sourcemaps.init()))
        .pipe($.sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', $.sass.logError))
        .pipe($.postcss([
            autoprefixer({
                browsers: config.browsers
            })
        ]))
        .pipe($.if(dev, $.sourcemaps.write('.')))
        .pipe($.if(!dev, $.postcss([
            cssnano({
                safe: true,
                autoprefixer: false
            })
        ])))
        .pipe($.if(dev, gulp.dest('.tmp/css'), gulp.dest('dist/css')))
        .pipe(reload({stream: true}));
});

// Scripts:vendor task
gulp.task('scripts:vendor', () => {
    return gulp.src(vendorJS)
        .pipe($.plumber())
        .pipe($.if(dev, $.sourcemaps.init()))
        .pipe($.concat('vendor.js'))
        .pipe($.if(dev, $.sourcemaps.write('.')))
        .pipe($.if(!dev, $.uglify({
            compress: {drop_console: true}
        })))
        .pipe($.if(dev, gulp.dest('.tmp/js'), gulp.dest('dist/js')))
        .pipe(reload({stream: true}));
});

// Scripts task
gulp.task('scripts', () => {
    return gulp.src(['app/scripts/**/*.js', '!app/scripts/vendor.js'])
        .pipe($.plumber())
        .pipe($.if(dev, $.sourcemaps.init()))
        .pipe($.babel({
            presets: ['env']
        }))
        .pipe($.if(dev, $.sourcemaps.write('.')))
        .pipe($.if(!dev, $.uglify({
            compress: {drop_console: true}
        })))
        .pipe($.if(dev, gulp.dest('.tmp/js'), gulp.dest('dist/js')))
        .pipe(reload({stream: true}));
});

// Views task
gulp.task('views', () => {
    return gulp.src('app/views/*.pug')
        .pipe($.plumber())
        .pipe($.pug({
            pretty: true
        }))
        .pipe($.if(dev, gulp.dest('.tmp'), gulp.dest('dist')))
        .pipe(reload({stream: true}));
});

// Fonts task
gulp.task('fonts', () => {
    return gulp.src('app/fonts/**/*.{eot,svg,ttf,woff,woff2}')
        .pipe($.if(dev, gulp.dest('.tmp/fonts'), gulp.dest('dist/fonts')));
});

// Images task
gulp.task('images', () => {
    return gulp.src('app/images/**/*')
        .pipe($.cache($.imagemin()))
        .pipe(gulp.dest('dist/images'));
});

// Extras task
gulp.task('extras', () => {
    return gulp.src([
        'app/*',
        '!app/fonts',
        '!app/images',
        '!app/scripts',
        '!app/styles',
        '!app/views'
    ], {
        dot: true
    }).pipe(gulp.dest('dist'));
});

// Serve task
gulp.task('serve', () => {
    runSequence('clean', ['views', 'styles', 'scripts:vendor', 'scripts', 'fonts'], () => {
        browserSync.init({
            notify: false,
            port: 9000,
            server: {
                baseDir: ['.tmp', 'app']
            }
        });

        gulp.watch([
            '.tmp/*.html',
            '.tmp/fonts/**/*',
            'app/images/**/*'
        ]).on('change', reload);

        gulp.watch('app/views/**/*.pug', ['views']);
        gulp.watch('app/styles/**/*.scss', ['styles']);
        gulp.watch(['app/scripts/**/*.js', '!app/scripts/vendor.js'], ['scripts']);
        gulp.watch('app/fonts/**/*', ['fonts']);
    });
});

// Serve:dist task
gulp.task('serve:dist', ['default'], () => {
    browserSync.init({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['dist']
        }
    });
});

// Build task
gulp.task('build', () => {
    runSequence(['views', 'styles', 'scripts:vendor', 'scripts', 'fonts', 'images', 'extras'], () => {
        gulp.src('dist/**/*').pipe($.size({
            title: 'build',
            gzip: true
        }));
    })
});

// Clean task
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Default task
gulp.task('default', () => {
    return new Promise(resolve => {
        dev = false;
        runSequence('clean', 'build', resolve);
    });
});
