module.exports = function(gulp, options) {
    // Move the plugin to the extension folder
    gulp.task('stage2', function() {
        var output = options.argv.buildDebug ?
            options.outputDebugName :
            options.outputName;
        return gulp.src(options.projectContent2.concat(output))
            .pipe(gulp.dest(options.bundleId));
    });
};