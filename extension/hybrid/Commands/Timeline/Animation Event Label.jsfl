(function () {

    // Include the command library
    var dir = fl.scriptURI.split("/");
    dir = dir.slice(0, dir.length - 3).join("/");
    fl.runScript(dir + "/JSFLLibraries/Command.jsfl");

    /**
     *  This script allows adding frame labels form animation events
     *  used by the Animation library.
     *  @class AnimationEventLabel
     *  @extends Command
     */
    var AnimationEventLabel = function () {
        if (!this.getDOM()) return;

        var timeline = this.dom.getTimeline();
        var sel = timeline.getSelectedFrames();

        if (sel === "") {
            alert("No frames selected!");
            return;
        }

        // The collection of labels
        var labels = this.getLabels(timeline);

        // The settings file
        this.settingsFile = 'Commands/Utilities/AnimationEventLabel.json';

        // The sections selected
        var sections = sel.length / 3;

        // Create the dialog so we can reuse it
        var dialog = this.createDialog();

        for (var i = 0; i < sections; i++) {
            var l = sel[i * 3];
            var sf = sel[i * 3 + 1];
            var ef = sel[i * 3 + 2] - 1;

            // Check that there is a selection
            if (ef - sf <= 0) {
                alert("Selecting a single frame is not a valid selection.");
                break;
            }

            // Get the settings
            var settings = dialog.create();

            // Silently dismiss
            if (settings.dismiss != "accept") return;

            var label = settings.label;
            var underscore = this.isCanvas ? true : settings.underscore == "true";

            // If we're not canvas save the underscore setting
            // so we can reset next time
            if (!this.isCanvas) {
                this.saveSettings(this.settingsFile, underscore);
            }

            var action = (underscore ? "_" : " ") + settings.action;

            // No label was provided
            if (!label) {
                alert("Label cannot be empty.");
                break;
            }

            // Already contains the labels!
            if (labels.contains(label) || labels.contains(label + action)) {
                alert("Label '" + label + "' is already taken.");
                break;
            }

            timeline.currentLayer = l;

            var start = timeline.layers[l].frames[sf];
            var end = timeline.layers[l].frames[ef];

            // If the start frame is not a keyframe
            if (!start || start.startFrame != sf) {
                timeline.convertToBlankKeyframes(sf);
                start = timeline.layers[l].frames[sf];
            }

            // If the end frame is not a keyframe
            if (!end || end.startFrame != ef) {
                timeline.convertToBlankKeyframes(ef);
                end = timeline.layers[l].frames[ef];
            }

            // Add the start label
            start.labelType = "name";
            start.name = label;

            // Add the stop label
            end.labelType = "name";
            end.name = label + action;
        }
    };

    // Extends Command
    var p = AnimationEventLabel.prototype = new Command();

    /**
     *  Get a collection of labels on the current timeline
     *  @method getLabels
     *  @param {Timeline} timeline The current timeline
     */
    p.getLabels = function (timeline) {
        var labels = [];

        // Get all of the frame labels
        for (var j = 0; j < timeline.layers.length; j++) {
            var layer = timeline.layers[j];
            if (layer.layerType != "guided" && layer.layerType != "folder") {
                for (var k = 0; k < layer.frames.length;) {
                    var frame = layer.frames[k];

                    if (frame.name !== "") {
                        labels.push(frame.name);
                    }
                    k += frame.duration;
                }
            }
        }
        return labels;
    };

    /**
     *  Create a dialog to create the frame labels
     *  @method createDialog
     *  @return {XULWindow} The created dialog
     */
    p.createDialog = function () {
        // Ask for the name of the label
        var dialog = this.dialog("Animation Event Label");

        var actions = [{
                label: "Stop",
                value: "stop"
            },
            {
                label: "Loop",
                value: "loop"
            },
        ];

        dialog.columns(2, 2)
            .openRow()
            .addLabel("Event Name", "label", 100)
            .addTextBox("label", "", 150)
            .closeRow()
            .openRow()
            .addLabel("Action Type", "action", 100)
            .addRadioGroup("action", actions)
            .closeRow();

        // Only give the javascript option
        // if we are not the html canvas type fla
        if (!this.isCanvas) {
            var underscore = this.loadSettings(this.settingsFile);
            dialog.addCheckbox("Javascript Compliant", "underscore", underscore);
        }
        return dialog;
    };

    // Run
    new AnimationEventLabel();

}());