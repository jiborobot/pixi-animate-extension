module.exports = function(gulp, options, plugins) {
    var output = options.argv.buildDebug ?
        options.outputDebugName :
        options.outputName;
    var cmd = options.packager + ' -sign ' +
        '"' + options.bundleId + '" ' +
        '"' + output + '" ' +
        '"' + options.packagerCert + '" ' +
        '"' + options.packagerPass + '" ' +
        '-tsa \"http://timestamp.digicert.com/\"';
    gulp.task('package2', plugins.shell.task([cmd], {
        quiet: false
    }));
};
