/**
 *  @module window
 */
(function (global) {

    /**
     *  An abstract command for extending cloudkid's commands
     *  @class Command
     */
    var Command = function () {
        /**
         *  The current document
         *  @property {Document} dom
         */
        this.dom = null;

        /**
         *  If the DOM is an html5 canvas FLA
         *  @property {Boolean} isCanvas
         */
        this.isCanvas = false;
    };

    // reference to the prototype
    var p = Command.prototype = {};

    /**
     *  Get the parent directory of a path or file
     *  @method dirname
     *  @param {String} path The path to get the parent directory for
     *  @return {String} The parent path
     */
    Command.dirname = function (path) {
        // Remove the last slash if it's there
        if (path.substr(-1, 1) == "/") {
            path = path.substr(0, path.length - 1);
        }

        // Get the parent directory
        var dir = path.split("/");
        dir.pop();
        dir = dir.join("/") + "/";

        return dir;
    };

    /**
     *  Get the config directory, relative to this directory
     *  this is a better version than configURI, for debugging
     *  purposese.
     *  @method dir
     *  @static
     *  @readOnly
     */
    Command.dir = function () {
        return Command.dirname(
            Command.dirname(fl.scriptURI)
        );
    }();

    /**
     *  Require a library file or additional script
     *  @method require
     *  @static
     *  @param {Object} path The relative path to file
     */
    Command.require = function (path) {
        fl.runScript(Command.dir + path);
    };

    // Include required utilities classes
    Command.require("JSFLLibraries/JSON.jsfl");
    Command.require("JSFLLibraries/ArrayUtils.jsfl");
    Command.require("JSFLLibraries/ObjectUtils.jsfl");

    /**
     *  Get the settings from the settings file
     *  @method loadSettings
     *  @param {String} path The relative path to file
     *  @return {String} The settings to grab
     */
    p.loadSettings = function (path) {
        var value = FLfile.read(Command.dir + path);
        if (value) {
            value = JSON.parse(value);
            if (value._isBasic) {
                value = value.value;
            }
        }
        return value;
    };

    /**
     *  Get the settings
     *  @method loadSettings
     *  @param {String} path The relative path to file
     *  @param {mixed} [value=""] The value to save
     *  @return {Boolean} If the save was successful
     */
    p.saveSettings = function (path, value) {
        value = value || "";

        if (typeof value != "object") {
            value = {
                "value": value,
                "_isBasic": true
            };
        }
        if (!FLfile.write(Command.dir + path, JSON.stringify(value))) {
            alert("Unable to save to " + path);
            return false;
        }
        return true;
    };

    /**
     *  Create a new dialog
     *  @method dialog
     *  @param {String} title The title of the dialog
     *  @param {*} [button] The collection of buttons
     */
    p.dialog = function (title) {
        //if (!global.XULWindow)
        //{
        Command.require("JSFLLibraries/XULWindow.jsfl");
        //}
        return new global.XULWindow(title, "accept", "cancel");
    };

    /**
     *  Get the current document and check if it's available,
     *  set's document
     *  @method getDOM
     *  @return {Document} Returns null if no document, also does alert
     */
    p.getDOM = function () {
        var dom = fl.getDocumentDOM();

        if (!dom) {
            alert("No document opened");
            return;
        }
        this.dom = dom;
        this.isCanvas = dom.type == "htmlcanvas";

        return dom;
    };

    // Assign to the namespace
    global.Command = Command;

}(window));