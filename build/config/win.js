module.exports = {
    pluginTempDebug: 'project/win/pixi-animate-vs2015/x64/Debug/pixi-animate-vs2015.dll',
    pluginTempRelease: 'project/win/pixi-animate-vs2015/x64/Release/pixi-animate-vs2015.dll',
    pluginFile: 'com.jibo.PixiAnimate/plugin/lib/win/PixiAnimate.fcm',
    installFolder: 'C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions\\com.jibo.PixiAnimate',

    // ZXP plugin packaging options
    packager: '.\\build\\bin\\ZXPSignCmd.exe',

    // VS2015 Solution file for building the win32 plugin
    projectFile: '.\\project\\win\\pixi-animate-vs2015\\pixi-animate-vs2015.sln',

    // This path only works for Visual Studio 2015 (VS14),
    // so this must be updated accordingly with VS studio switch
    VCTargetsPath: "C:\\Program Files (x86)\\MSBuild\\Microsoft.Cpp\\v4.0\\V140",

    // Command to uncompress to local install folder
    // installCmd: '.\\build\\bin\\7za.exe x -y -bb0 -o"${installFolder}" "${output}"',
    installCmd: '.\\ExManCmd_win\\ExManCmd.exe /install "${output}"',
    uninstallCmd: '.\\ExManCmd_win\\ExManCmd.exe /remove "com.jibo.PixiAnimate"',

    // List of gulp task to run when creating plugins
    pluginTasks: ['plugin-win-debug', 'plugin-win']
};