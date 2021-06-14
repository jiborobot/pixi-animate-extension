module.exports = function(gulp, options, plugins) {
    gulp.task('clean', function(){
        var output = options.argv.buildDebug ?
            options.outputDebugName :
            options.outputName;
        return plugins.del([
            options.bundleId,
            output,
            options.pluginFile
        ]);
    });
};