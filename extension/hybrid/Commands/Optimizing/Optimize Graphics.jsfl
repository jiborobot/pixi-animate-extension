(function () {

    /**
     *  The class for removing unused graphic frames
     *  @class OptimizeGraphics
     */
    var OptimizeGraphics = function () {
        /**
         *  The cache of items that have already been searched
         *  @property {Array} objectsSearched
         */
        this.objectsSearched = [];

        /**
         *  The collection of frames found
         *  @property {Array} framesFound
         */
        this.framesFound = [];

        /**
         *  The specific library item we're searching for
         *  @property {LibraryItem} searchItem
         */
        this.searchItem = null;

        /**
         *  CC-support if the current FLA is an html5canvase
         *  @property {Boolean} isCanvas
         */
        this.isCanvas = false;

        /**
         *  The number of frames in the search item
         *  @property {int} frameCount
         */
        this.frameCount = 0;

        // run the constructor
        this.initialize();
    };

    // Reference to the prototype
    var p = OptimizeGraphics.prototype = {};

    /**
     *  Constructor, start creating the optimize graphics object
     *  @method initialize
     */
    p.initialize = function () {
        var i = 0,
            j = 0,
            length = 0;

        if (!fl.getDocumentDOM()) {
            alert("No document opened.");
            return;
        }

        var doc = fl.getDocumentDOM();
        var curTimelines = doc.timelines;
        var libraryItems = doc.library.items;
        var items = doc.library.getSelectedItems();

        if (items.length === 0) {
            alert("Must select a library item to optimize");
            return;
        }

        if (doc.type) {
            this.isCanvas = (doc.type == "htmlcanvas");
        }
        this.searchItem = items[0];
        var frameCount = this.frameCount = this.searchItem.timeline.frameCount;

        var con = confirm("You're about to optimize '" + this.searchItem.name + "' by removing unused frames. This may take several minutes, do you want to continue?");

        if (!con) {
            return;
        }

        fl.showIdleMessage(false);

        // Clear the output window
        fl.outputPanel.clear();
        fl.trace("+------------------------------------------+");
        fl.trace("| Optimizing '" + this.searchItem.name + "'");
        fl.trace("+------------------------------------------+\n");
        var now = microtime();

        // Search through the timelines of this document
        for (i = 0, length = curTimelines.length; i < length; ++i) {
            this.findSymbolsByTimeline(curTimelines[i]);
        }

        // Search through library items not put on stage
        for (j = 0, length = libraryItems.length; j < length; ++j) {
            this.searchLibraryItem(libraryItems[j]);
        }

        if (this.framesFound.length === 0) {
            alert("No frames found in this document.");
        } else {
            this.framesFound.sort(sortNumber);
            doc.library.editItem(this.searchItem.name);
            var timeline = doc.getTimeline();
            for (j = 0; j < frameCount; j++) {
                if (!inObject(j, this.framesFound)) {
                    fl.trace("Clearing frame : " + (j + 1));
                    this.clearFrame(timeline, j);
                }
            }
        }
        var sec = Math.round((microtime() - now) * 1000) / 1000;
        fl.trace("\nFinished optimizing in " + sec + " sec");

        fl.showIdleMessage(true);
    };

    /**
     *  Get the current time in microtime
     *  @method microtime
     *  @private
     *  @return {Number} Either the Number of seconds or radable seconds
     */
    var microtime = Date.now ?
        function () {
            return Date.now() / 1000;
        } :
        function () {
            return new Date().getTime() / 1000;
        };

    /**
     *  Clear the frame
     *  @method clearFrame
     *  @param {Timeline} timeline The timeline object
     *  @param {int} frameIndex The frame number to clear
     */
    p.clearFrame = function (timeline, frameIndex) {
        var n = frameIndex;
        var layers = timeline.layers;

        for (var i = 0, length = layers.length; i < length; i++) {
            var layer = layers[i];
            if (layer.layerType != "normal" || !layer.frames[n]) {
                continue;
            }
            var frame = layer.frames[n];
            if (frame.elements.length === 0) {
                continue;
            }
            timeline.setSelectedLayers(i);
            if (frame.startFrame + frame.duration > n + 1)
                timeline.insertKeyframe(n + 1);
            timeline.clearFrames(n, n + 1);
        }
    };

    /**
     *  Comparator function for sorting
     *  @private
     *  @method sortNumber
     *  @param {Number} a
     *  @param {Number} b
     *  @return {Number}
     */
    var sortNumber = function (a, b) {
        return a - b;
    };

    /**
     *  Find a symbol by the timeline
     *  @method findSymbolsByTimeline
     *  @param {Timeline} tLine The timeline to search on
     */
    p.findSymbolsByTimeline = function (tLine) {
        var j = 0,
            jLen = 0,
            k = 0,
            kLen = 0,
            l = 0,
            lLen = 0,
            el,
            frm,
            layer,
            lyrVisibility;

        var layers = tLine.layers;
        // cycle through each of the layers in this timeline
        for (j = 0, jLen = layers.length; j < jLen; ++j) {
            // cycle through each of the layers in this timeline
            layer = layers[j];

            if (layer.layerType != "normal" || this.framesFound.length == this.frameCount) {
                continue;
            }

            // store the layer visibility and then make the layer visible.
            // Elements cannot be found on invisible layers
            lyrVisibility = layer.visible;
            layer.visible = true;

            var frames = layer.frames;
            // Loop through the frames
            for (k = 0, kLen = frames.length; k < kLen;) {
                // step through the frames on this layer
                frm = frames[k];

                // Ignore empty keyframes or non-keyframes
                if (frm.elements.length === 0 || this.framesFound.length == this.frameCount) {
                    k += frm.duration;
                    continue;
                }

                var elements = frm.elements;
                for (l = 0, lLen = elements.length; l < lLen; ++l) {
                    // then cycle through the elements on this frame
                    el = elements[l];

                    if (el.elementType == "instance") {
                        if (el.libraryItem == this.searchItem) {
                            // If we're a movieclip or a button, then select all frames
                            if (el.symbolType != "graphic") {
                                this.addFrameRange(0, this.frameCount);
                            } else {
                                // If we are loop or play once, we will select a range
                                if (el.loop == "loop" || el.loop == "play once") {
                                    this.addFrameRange(el.firstFrame, el.firstFrame + frm.duration, el.loop == "loop");
                                } else {
                                    // Easier is to select first frame
                                    this.addFrame(el.firstFrame);
                                }
                            }
                        } else {
                            // lets get the library item for this element
                            this.searchLibraryItem(el.libraryItem);
                        }
                    }
                }
                k += frm.duration;
            }

            // return this layer to its original visibility (optional)
            layer.visible = lyrVisibility;
        }
    };

    var validSymbolTypes = ["graphic", "movie clip", "button"];

    /**
     *  Search the library by item
     *  @method searchLibraryItem
     *  @param {LibraryItem} libItem The library item to search for
     */
    p.searchLibraryItem = function (libItem) {
        // Ignore invalid symbol types
        if (!inObject(libItem.itemType, validSymbolTypes) || (!this.isCanvas && libItem.linkageImportForRS)) {
            this.objectsSearched.push(libItem.name);
            return;
        }

        // only process new objects and not runtime shared-assets
        if (!inObject(libItem.name, this.objectsSearched)) {
            this.objectsSearched.push(libItem.name);

            // get the timeline of this library symbol
            libTLine = libItem.timeline;

            if (libTLine) {
                // if there is a timeline, repeat the scan as a recursion
                this.findSymbolsByTimeline(libTLine);
            }
        }
    };

    /**
     *  Add a frame number to the already found frames
     *  @method addFrame
     *  @param {int} frameNum The frame number found
     */
    p.addFrame = function (frameNum) {
        if (!inObject(frameNum, this.framesFound)) {
            this.framesFound.push(frameNum);
        }
    };

    /**
     *  Add a frame range to already found frames
     *  @method addFrameRange
     *  @param {int} startFrame The starting frame index
     *  @param {int} endFrame The ending frame index
     *  @param {Boolean} [bLoop=false] If the graphic is set to loop
     */
    p.addFrameRange = function (startFrame, endFrame, bLoop) {
        var frameCount = this.frameCount;
        for (var i = startFrame; i < endFrame; i++) {
            if (i < frameCount) {
                this.addFrame(i);
            } else if (i >= frameCount && bLoop) {
                this.addFrame(i % frameCount);
            }
        }
    };

    /**
     *  utility function to check if a value is in an object or array
     *  @method inObject
     *  @private
     *  @static
     *  @param {*} needle The value to check
     *  @param {Object|Array} haystack The object to check in
     *  @param {Boolean} If the needle is in the haystack
     */
    var inObject = function (needle, haystack) {
        for (var k in haystack) {
            if (haystack[k] == needle) {
                return true;
            }
        }
        return false;
    };

    // Start
    new OptimizeGraphics();

}());