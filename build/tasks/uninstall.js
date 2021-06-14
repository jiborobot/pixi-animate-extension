module.exports = function(gulp, options, plugins) {
    if (/^win/.test(process.platform)) {
        gulp.task('uninstall', plugins.shell.task([options.uninstallCmd], {
            'quiet': !options.argv.buildDebug,
            ignoreErrors: true
        }));
    }
    else {
        gulp.task('uninstall', function(){
            return plugins.del([options.installFolder], {
                force: true
            });
        });
    }
};