module.exports = function(gulp, options, plugins) {
    gulp.task('clean-all', gulp.series('clean', 'clean-build', 'uninstall'));
};