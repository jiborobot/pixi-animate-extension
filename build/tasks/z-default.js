const log = require('fancy-log');

module.exports = function(gulp, options, plugins) {

    var debug = options.argv.buildDebug;
    var plugin = options.argv.plugin;
    var install = options.argv.install;

    log("+-------------------+".green);
    log("|    PixiAnimate    |".green);
    log("+-------------------+".green);
    log("Mode: ".gray, (debug ? "Debug" : "Release").yellow);

    var tasks = [];

    if (plugin) {
        tasks.push('plugin');
    }

    tasks.push(
        'clean',
        'lint',
        'stage'
    );

    // Turn on remote debugging
    if (debug) {
        tasks.push('remote-debug');
    }

    tasks.push(
        'build-publish',
        'build-dialog',
        'build-preview-app',
        'build-preview',
        'build-spritesheets',
        'runtime-copy',
        'runtime-copy-debug',
        'plugin-copy-mac',
        'plugin-copy-win',
        'package',
        'clean-stage',
        // now that the custom plugin has been built, package it further with some JSFL scripts
        'stage2',
        'package2',
        'clean-stage',
    );

    if (install) {
        tasks.push(
            'uninstall',
            'pre-install',
            'install'
        );
    }

    gulp.task('default', gulp.series(...tasks));
};
