"use strict";

const electron = require('electron');
const app = electron.app;
const minimist = require('minimist');
const path = require('path');
const semver = require('semver');
const argv = minimist(process.argv.slice(2), {
    boolean: ['debug', 'compress', 'perf'],
    string: ['assets', 'src'],
    default: {
        debug: false,
        compress: false,
        perf: false
    }
});

app.on('ready', function() {

    if (!semver.gte(process.versions.electron, '1.8.2'))
    {
        alert("Must use Electron v1.8.2 or greater. Install using 'npm install -g electron-prebuilt'");
        quit();
    }
    else if (!argv.src)
    {
        alert("Source must be path to data output.");
        quit();
    }
    else if (!/\.json$/i.test(argv.src))
    {
        alert("Data file must be valid JSON.");
        quit();
    }
    else
    {
        // For measuring performance
        const startTime = process.hrtime()[1];

        // Include classes
        const Publisher = require('./Publisher');
        const DataUtils = require('./utils/DataUtils');

        // Create a new publisher
        const publisher = new Publisher(
            argv.src, // path to the javascript file
            argv.compress, // If the output should be compressed
            argv.debug, // Don't delete the source file
            argv.assets || __dirname
        );

        // Allow override of snippets for debugging purposes
        publisher.renderer.snippetsPath = path.resolve(
            argv.assets || __dirname, 'snippets'
        );

        publisher.run((err) => {
            if (err) {
                alert(err);
                return quit();
            }
            // Output performance information
            if (argv.perf)
            {
                let executionTime = DataUtils.toPrecision(
                    (process.hrtime()[1] - startTime) / Math.pow(10, 9), 4
                );
                console.log(`\nExecuted in ${executionTime} seconds\n`);
            }
            quit();
        });
    }
});

function quit() {
    app.quit();
}

function alert(message)
{
    const nativeImage = electron.nativeImage;
    let dialog;
    try
    {
        dialog = require('dialog');
    }
    catch(e)
    {
        dialog = electron.dialog;
    }

    // Use the assets if it's setup, debugging purposes
    const icon = path.resolve(argv.assets || __dirname, 'assets/icon.png');

    dialog.showMessageBoxSync({
        type: 'error',
        message: 'A publishing error occured',
        detail: argv.debug && message instanceof Error ? message.stack : String(message),
        buttons: ['Close'],
        icon: nativeImage.createFromPath(icon)
    });
}