# PixiAnimate Extension

Creates a custom FLA document which support publishing to [PixiJS](http://pixijs.com) natively in Adobe Animate CC (formerly Flash CC 2015).

## Examples

See [examples](https://github.com/jiborobot/pixi-animate-examples) for sample FLA document to test features of PixiAnimate.


## Dependencies

The following dependencies are required in order to publishing FLA document created with this Plugin.

* Adobe Flash CC 2015+ or Adobe Animate CC
* Mac OS X or Windows x64
* [Node & NPM](http://nodejs.org)
* [Electron](http://electron.atom.io/) `npm install -g electron`

## Installation

If you are trying to install with Adobe Animate CC 2015, you **cannot** install the ZXP with Adobe Extension Manager CC (this not longer is supported in CC 2015). There are two ways to install:

* [Enable syncing](https://www.adobeexchange.com/resources/19) in your Adobe CC desktop application (**recommended**); or
* Use [Anastasiy’s Extension Manager](https://install.anastasiy.com/) to manually install.

## Building

To get setup, please follow the instructions outlined from [Adobe's documentation](https://helpx.adobe.com/flash/using/enabling-support-custom-platforms.html#Building%20a%20Flash%20custom%20platform%20support%20plug-in). This will enable you to build the project itself and see the plugin exposed from Adobe Animate CC.

- Some project / file names may be changed due to not wanting to produce a plugin named "SamplePlugin".
- The certificate password is: `password`
- If on Windows, in order to use the `--install` build option, you'll need to download [Adobe's extension utility](https://partners.adobe.com/exchangeprogram/creativecloud/support/exman-com-line-tool.html) and unzip it to the extension repository folder.

### CEP Debug Mode

To setup your platform for development, you must enable debugging in your Adobe preferences for CEP. **_VERY Important to reboot your machine after making this change_** or it will not take effect.

#### Windows

Go to Registry, `regedit` > `HKEY_CURRENT_USER/Software/Adobe/CSXS.6`, then add a new entry `PlayerDebugMode` of type `"string"` with the value of `"1"`.

#### OS X
Add the entry `PlayerDebugMode` of type `"string"` with value set to `1` in the plist file `/Users/<username>/Library/Preferences/com.adobe.CSXS.6.plist`

### Mac OS X Instructions

To build and install to Animate CC directly, run the script. This will copy the plugin and then install in the CEP extension's folder (`/Library/Application Support/Adobe/CEP/extensions/com.jibo.PixiAnimate/`)

```bash
gulp --install
```

To build the extension in debug mode and allow for remote debugging, run this command. Navigate to http://localhost:8008 to get the DevTools for the Publish Settings dialog.

```bash
gulp --buildDebug --install
```

To rebuild the C++ code on the current platform, use the `--plugin` flag. This will build the plugin for both debug and release.

```bash
gulp --buildDebug --install --plugin
```

Or to ONLY build the plugin without building the rest of the extension.

For release:
```bash
gulp plugin
```

### Windows Instructions ###
* Microsoft Windows 7 64-bit or higher required
* Adobe Animate CC 2015 x64 w/ ZXP utility for Windows
* Microsoft Visual Studio 2015 Community or higher
  * Common Tools for Visual C++ 2015
* Latest NodeJS

**Notice: When switching visual studio from 14 (2015) to a different version, do the following**

* Update `projectFile` and `VCTargetsPath` in **build/config/win.js** to the newly selected toolset
* Update the solution and project files (You probably cannot downgrade these files without rebuilding them from scratch)

Update your npm first
```
npm install -g npm
```

Install global npm packages
```
npm install -g electron gulp-cli
```

Install or restore local packages
```
npm update
```

Build plugin and install plugin
```
gulp --plugin --install
```

Now use the ZXP utility for windows to install the **PixiAnimate.zxp** plugin for Adobe Animate CC 2015, make sure to remove the existing plugin before install

### Note on JSFL scripts - they are taken from [Springroll's Flash Toolkit](https://github.com/SpringRoll/FlashToolkit), as the used scripts are very relevant for optimization of Pixi Animate content.
