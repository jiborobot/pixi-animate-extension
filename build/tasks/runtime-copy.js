module.exports = function(gulp, options, plugins) {
    gulp.task('runtime-copy', function() {
        return gulp.src(options.runtimeResources, {base: 'node_modules'})
            .pipe(plugins.rename(function(path) {
                if (path.dirname.indexOf('pixi.js-4') > -1) {
                    path.dirname = 'v1';
                } else if (path.dirname.indexOf('pixi-animate-1') > -1) {
                    path.dirname = 'v1';
                } else {
                    path.dirname = 'v2';
                }
            }))
            .pipe(gulp.dest(options.runtimeOutput));
    });
};