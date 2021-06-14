module.exports = function(gulp, options, plugins) {
    gulp.task('pre-install', function(){
        if (!/^win/.test(process.platform)) {
            plugins.fs.mkdirSync(options.installFolder);
            return gulp.src('.');
        }
        else
        {
            return gulp.src('.');
        }
    });
};