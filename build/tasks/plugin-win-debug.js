module.exports = function(gulp, options, plugins) {
    gulp.task('plugin-win-debug', function() {
        process.env.VCTargetsPath = options.VCTargetsPath;
        return gulp.src(options.projectFile)
            .pipe(plugins.msbuild({
                targets: ['Clean', 'Build'],
                properties: { Configuration: 'Debug' },
                architecture: 'x64',
                errorOnFail: true,
                // verbosity: 'diagnostic',
                // stdout: true,
                fileLoggerParameters: 'LogFile=Build.log;Append;Verbosity=diagnostic'
            }));
        });
};
