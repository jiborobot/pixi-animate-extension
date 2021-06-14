module.exports = function(gulp, options, plugins) {
    gulp.task('plugin-win', function() {
        process.env.VCTargetsPath = options.VCTargetsPath;
        return gulp.src(options.projectFile)
            .pipe(plugins.msbuild({
                targets: ['Clean', 'Build'],
                properties: { Configuration: 'Release' },
                architecture: 'x64',
                errorOnFail: true,
                fileLoggerParameters: 'LogFile=Build.log;Append;Verbosity=quiet'
            }));
        });
};
