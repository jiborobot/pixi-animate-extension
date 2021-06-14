/*global CSEvent:true, CSInterface:true */
(function(document, cep)
{
    // Convenience wrappers for the querySelector, poor-man's jQuery
    var $ = document.querySelector.bind(document);
    var $$ = document.querySelectorAll.bind(document);

    // Interface for interaction with the CEP API
    var csInterface;

    // The root parent of the FLA
    var parentPath;

    // UI Elements
    var $body = $('body');
    var $outputFile = $('#outputFile');
    var $outputVersion = $("#outputVersion");
    var $htmlPath = $("#htmlPath");
    var $imagesPath = $("#imagesPath");
    var $soundsPath = $("#soundsPath");
    var $libsPath = $("#libsPath");
    var $compactShapes = $("#compactShapes");
    var $compressJS = $("#compressJS");
    var $outputFormat = $("#outputFormat");
    var $namespace = $("#namespace");
    var $stageName = $("#stageName");
    var $html = $("#html");
    var $libs = $("#libs");
    var $images = $("#images");
    var $sounds = $("#sounds");
    var $loopTimeline = $("#loopTimeline");
    var $hiddenLayers = $("#hiddenLayers");
    var $publishButton = $("#publishButton");
    var $browseButton = $("#browseButton");
    var $cancelButton = $("#cancelButton");
    var $okButton = $("#okButton");
    var $spritesheets = $("#spritesheets");
    var $spritesheetSize = $("#spritesheetSize");
    var $spritesheetScale = $("#spritesheetScale");

    // Execute JSFL scripts
    function exec(script, callback)
    {
        var args = [];
        for (var arg, i = 1; i < arguments.length; i++)
        {
            arg = arguments[i];
            if (typeof arg == "function")
            {
                callback = arg;
            }
            else
            {
                args.push(JSON.stringify(arg));
            }
        }
        var cmd = script + "(" + args.join(',') + ")";
        csInterface.evalScript(cmd, function(data)
        {
            if (data && callback)
            {
                if (data == "null") data = null;
                else if (data == "true") data = true;
                else if (data == "false") data = false;
                else if (data == "undefined") data = undefined;
                else if (/^\{/.test(data)) data = JSON.parse(data);
                callback(data);
            }
            else if (callback)
            {
                callback();
            }
        });
    }

    // Filters based
    function isValidInput(input) {
        var disabled = input.className.indexOf('disabled') > -1;
        if (disabled) return true;
        var regex = new RegExp(input.dataset.validate, 'i');
        var success = regex.test(input.value);
        if (!success) {
            input.className += ' focus';
            exec('alert', input.dataset.error || 'Validation error');
        }
        return success;
    }

    // Remove focus style on click
    document.addEventListener('mouseup', function(){
        var inputs = $$('input');
        for (var n = 0; n < inputs.length; n++)
        {
            var input = inputs[n];
            input.className = input.className.replace('focus', '');
        }
    });

    function isReadyToPublish() {
        return isValidInput($outputFile)
            && isValidInput($htmlPath)
            && isValidInput($namespace)
            && isValidInput($stageName)
            && isValidInput($spritesheetScale);
    }

    // The prepend name of the settings object keys
    var SETTINGS = "PublishSettings.PixiJS.";

    function ifBoolOr(arg, defaultValue)
    {
        return typeof arg !== "undefined" ? arg == "true" : defaultValue;
    }

    function restoreState(event)
    {
        var data = event.data;

        if (data[SETTINGS + "OutputFile"])
        {
            // Booleans options
            $compactShapes.checked = ifBoolOr(data[SETTINGS + "CompactShapes"], true);
            $compressJS.checked = ifBoolOr(data[SETTINGS + "CompressJS"], true);
            $html.checked = ifBoolOr(data[SETTINGS + "HTML"], true);
            $libs.checked = ifBoolOr(data[SETTINGS + "Libs"], true);
            $images.checked = ifBoolOr(data[SETTINGS + "Images"], true);
            $sounds.checked = ifBoolOr(data[SETTINGS + "Sounds"], true);
            $loopTimeline.checked = ifBoolOr(data[SETTINGS + "LoopTimeline"], true);
            $spritesheets.checked = ifBoolOr(data[SETTINGS + "Spritesheets"], true);

            onToggleInput.call($html);
            onToggleInput.call($images);
            onToggleInput.call($libs);
            onToggleInput.call($sounds);

            // String options
            $htmlPath.value = data[SETTINGS + "HTMLPath"];
            $libsPath.value = data[SETTINGS + "LibsPath"];
            $imagesPath.value = data[SETTINGS + "ImagesPath"];
            $soundsPath.value = data[SETTINGS + "SoundsPath"];
            $namespace.value = data[SETTINGS + "Namespace"];
            $outputFile.value = data[SETTINGS + "OutputFile"];
            $stageName.value = data[SETTINGS + "StageName"];
            $spritesheetSize.value = data[SETTINGS + "SpritesheetSize"] || 1024;
            $spritesheetScale.value = data[SETTINGS + "SpritesheetScale"] || 1.0;

            $outputVersion.value = data[SETTINGS + "OutputVersion"] || "2.0";

            var outputFormat = data[SETTINGS + "OutputFormat"];
            var oldCommonJS = ifBoolOr(data[SETTINGS + "CommonJS"], false);
            if (!outputFormat)
            {
                outputFormat = oldCommonJS ? 'cjs' : 'es6';
            }
            $outputFormat.value = outputFormat;

            var dependencies = $$('.setting-dependency');
            for (var i = 0, len = dependencies.length; i < len; i++) {
                handleChanges.call(dependencies[i]);
            }

            // Global options
            $hiddenLayers.checked = data["PublishSettings.IncludeInvisibleLayer"] == "true";
        }
        else
        {
            // put in the default values
            exec('getDocumentName', function(name)
            {
                $htmlPath.value = name + '.html';
                $outputFile.value = name + '.js';
                $stageName.value = name.replace(/[^A-Za-z0-9_]/g, '_');
            });
        }

        isLoaded();
    }

    function saveState()
    {
        var data = {};

        // Booleans
        data[SETTINGS + "CompactShapes"] = $compactShapes.checked.toString();
        data[SETTINGS + "CompressJS"] = $compressJS.checked.toString();
        data[SETTINGS + "HTML"] = $html.checked.toString();
        data[SETTINGS + "Libs"] = $libs.checked.toString();
        data[SETTINGS + "Images"] = $images.checked.toString();
        data[SETTINGS + "Sounds"] = $sounds.checked.toString();
        data[SETTINGS + "LoopTimeline"] = $loopTimeline.checked.toString();
        data[SETTINGS + "Spritesheets"] = $spritesheets.checked.toString();

        // Strings
        data[SETTINGS + "OutputFile"] = winPathToURI( $outputFile.value.toString() );
        data[SETTINGS + "HTMLPath"] = $htmlPath.value.toString();
        data[SETTINGS + "LibsPath"] = $libsPath.value.toString();
        data[SETTINGS + "ImagesPath"] = $imagesPath.value.toString();
        data[SETTINGS + "SoundsPath"] = $soundsPath.value.toString();
        data[SETTINGS + "Namespace"] = $namespace.value.toString();
        data[SETTINGS + "StageName"] = $stageName.value.toString();
        data[SETTINGS + "SpritesheetSize"] = $spritesheetSize.value.toString();
        data[SETTINGS + "SpritesheetScale"] = $spritesheetScale.value.toString();

        data[SETTINGS + "OutputVersion"] = $outputVersion.value.toString();
        data[SETTINGS + "OutputFormat"] = $outputFormat.value.toString();

        // Global options
        data["PublishSettings.IncludeInvisibleLayer"] = $hiddenLayers.checked.toString();

        var event = new CSEvent();
        event.scope = "APPLICATION";
        event.type = "com.adobe.events.flash.extension.savestate";
        event.data = JSON.stringify(data);
        event.extensionId = csInterface.getExtensionID();
        csInterface.dispatchEvent(event);
    }

    function isLoaded()
    {
        $body.className = $body.className.replace('loading', '');
    }

    // Handle the toggles
    function onToggleInput()
    {
        var toggle = $(this.dataset.toggle);
        toggle.disabled = !this.checked;
        toggle.className = toggle.className.replace('disabled', '');
        if (toggle.disabled) {
            toggle.className += " disabled";
        }
    }

    function handleChanges()
    {
        var dependents = $$('.setting-dependent');
        var disabled;
        for (var i = 0, len = dependents.length; i < len; i++) {
            var dependent = dependents[i];
            if (dependent.dataset.dependency !== this.id) {
                continue;
            }
            var when = dependent.dataset.when;
            if (when === 'checked') {
                disabled = !this.checked;
                dependent.className = dependent.className.replace('hidden', '');
                if (disabled) {
                    dependent.className += " hidden";
                }
            }
            else {
                disabled = when.indexOf('!') === 0 ? this.value === when.substring(1) : this.value !== when;
                dependent.className = dependent.className.replace('hidden', '');
                if (disabled) {
                    dependent.className += " hidden";
                }
            }
        }
        // do a quick check for output format, because it is complicated
        if ($outputVersion.value === '1.0') {
            if ($outputFormat.value.indexOf('es6') > -1) {
                $outputFormat.value = 'es5';
            }
        }
        else {
            if ($outputFormat.value === 'es5') {
                $outputFormat.value = 'es6';
            }
        }
    }

    function refreshColorTheme()
    {
        var skinInfo = JSON.parse(cep.getHostEnvironment()).appSkinInfo;
        var darkTheme = (skinInfo.appBarBackgroundColor.color.blue < 128)
        $body.className = darkTheme ? 'dark' : 'light';
    }

    function close()
    {
        csInterface.closeExtension();
    }

    function winPathToURI(path)
    {
        while (path.indexOf("\\") > -1)
        {
            path = path.replace("\\", "/");
        }
        return path;
    }

    $publishButton.onclick = function()
    {
        if (isReadyToPublish())
        {
            saveState();
            exec("publish");
        }
    };

    $browseButton.onclick = function()
    {
        exec("browseOutputFile", function(output)
        {
            if (output)
            {
                var path = require('path');
                $outputFile.value = path.relative(parentPath, output);
            }
        });
    }

    $cancelButton.onclick = close;

    $okButton.onclick = function()
    {
        if (isReadyToPublish())
        {
            saveState();
            close();
        }
    };

    // Handle the toggle buttons which disable
    var toggles = $$('.toggle');
    for(var i = 0, len = toggles.length; i < len; i++)
    {
        toggles[i].onchange = onToggleInput.bind(toggles[i]);
    }
    // Handle settings with non-standard dependencies
    var dependencies = $$('.setting-dependency');
    for (i = 0, len = dependencies.length; i < len; i++) {
        dependencies[i].onchange = handleChanges.bind(dependencies[i]);
    }

    if (!cep)
    {
        isLoaded();
        return;
    }

    csInterface = new CSInterface();
    csInterface.setWindowTitle('PixiAnimate Publish Settings');

    // Gets the style information such as color info from the skinInfo,
    // and redraw all UI controls of your extension according to the style info.
    refreshColorTheme();
    csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, refreshColorTheme);

    // Check for the parent document
    exec('getParentPath', function(parent)
    {
        var path = require('path');
        parentPath = path.dirname(parent);
        if (path.extname(parent).toLowerCase() == ".xfl")
        {
            parentPath = path.dirname(parentPath);
        }

        // Handle set state from the saved settings
        csInterface.addEventListener("com.adobe.events.flash.extension.setstate", restoreState);

        // Restore from publish settings
        exec('getPublishSettings', restoreState);
    });

}(document, window.__adobe_cep__));
