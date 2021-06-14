module.exports = {

    // Name
    name: 'PixiAnimate',

    // Pattern for loading tasks
    pattern: ['build/tasks/*.js'],

    // Contains the project folder
    projectContent: ['extension/plugin/**/*'],
    projectContent2: ['extension/hybrid/**/*', 'assets/logo.png'],

    // Temporary staging folder
    bundleId: 'com.jibo.PixiAnimate',

    // Output file name
    outputName: 'PixiAnimate.zxp',
    outputDebugName: 'PixiAnimate-debug.zxp',

    // Remote debugging for panels in Flash
    remoteDebug: 'build/debug.xml',
    remoteDebugOutput: '.debug',

    packagerCert: 'build/certificate.p12',
    packagerPass: 'password',

    // Vendor release for the runtime
    runtimeOutput: 'com.jibo.PixiAnimate/runtime',
    runtimeDebugOutput: 'com.jibo.PixiAnimate/runtime-debug',
    runtimeResources: [
        'node_modules/pixi.js-4/dist/pixi.min.js',
        'node_modules/pixi-animate-1/dist/pixi-animate.min.js',
        'node_modules/pixi.js-6/dist/browser/pixi.min.js',
        'node_modules/pixi-animate-2/dist/pixi-animate.min.js'
    ],
    runtimeDebugResources: [
        'node_modules/pixi.js-4/dist/pixi.js',
        'node_modules/pixi.js-4/dist/pixi.js.map',
        'node_modules/pixi-animate-1/dist/pixi-animate.js',
        'node_modules/pixi-animate-1/dist/pixi-animate.js.map',
        'node_modules/pixi.js-6/dist/browser/pixi.js',
        'node_modules/pixi.js-6/dist/browser/pixi.js.map',
        'node_modules/pixi-animate-2/dist/pixi-animate.js',
        'node_modules/pixi-animate-2/dist/pixi-animate.js.map'
    ],

    // The files to source when running watch
    watchFiles: [
        './**/*.*',
        '!node_modules/**',
        '!extension/plugin/node_modules/**',
        '!com.jibo.PixiAnimate',
        '!extension/plugin/dialog/cep/**',
        '!extension/plugin/bin'
    ],

    // The files to include for JS linting
    lintFiles: [
        'build/**/*.js',
        'src/extension/**/*.js',
        'gulpfile.js'
    ],

    buildPublish: {
        src: 'src/extension/publish',
        dest: 'com.jibo.PixiAnimate/publish'
    },

    buildSpritesheets: {
        src: 'src/extension/publish/spritesheets/',
        name: 'spritesheets.js',
        dest: 'com.jibo.PixiAnimate/publish'
    },

    buildPreview: {
        src: 'src/extension/preview/preview.js',
        name: 'preview.js',
        dest: 'com.jibo.PixiAnimate/preview'
    },

    buildPreviewApp: {
        src: 'src/extension/preview',
        dest: 'com.jibo.PixiAnimate/preview'
    },

    buildDialog: {
        src: 'src/extension/dialog',
        name: 'main.js',
        dest: 'com.jibo.PixiAnimate/dialog'
    },
    mac: require('./mac'),
    win: require('./win')
};