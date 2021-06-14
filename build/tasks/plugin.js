module.exports = function(gulp, options, plugins) {
    gulp.task('plugin', gulp.series(...options.pluginTasks.slice()));
};
