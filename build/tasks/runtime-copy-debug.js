module.exports = function(gulp, options, plugins) {
    gulp.task('runtime-copy-debug', function() {
        return gulp.src(options.runtimeDebugResources, {base: 'node_modules'})
            .pipe(plugins.rename(function (path) {
                if (path.dirname.indexOf('pixi.js-4') > -1) {
                    path.dirname = 'v1';
                } else if (path.dirname.indexOf('pixi-animate-1') > -1) {
                    path.dirname = 'v1';
                } else {
                    path.dirname = 'v2';
                }
            }))
            .pipe(gulp.dest(options.runtimeDebugOutput));
    });
};