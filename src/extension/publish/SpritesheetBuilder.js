const electron = require('electron');
const ipc = electron.ipcMain;
const BrowserWindow = electron.BrowserWindow;  // Native browser window

/**
 * Create a renderer to generate the spritesheets.
 * @class SpritesheetBuilder
 * @constructor
 * @param {Object} settings
 * @param {Object} settings.assets
 * @param {String} settings.outputsize
 * @param {int} settings.size
 * @param {Number} settings.scale
 * @param {Boolean} settings.debug
 * @param {Function} done
 */
const SpritesheetBuilder = function(settings, assetsPath, done)
{
    let renderer = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    renderer.loadURL('file://' + assetsPath + '/spritesheets.html');

    ipc.once('done', (ev, data) => {
        const response = JSON.parse(data);
        renderer.close();
        renderer = null;
        done(response);
    });

    renderer.webContents.on('did-finish-load', () => {

        // Support commandline debugging
        const init = assetsPath === __dirname ?
            assetsPath + "/spritesheets" :
            require.resolve('./spritesheets/index');

        renderer.webContents.send('init', init);
        renderer.webContents.send('settings', JSON.stringify(settings));
    });
};

module.exports = SpritesheetBuilder;