"use strict";

const path = require('path');
const fs = require('fs');
const DataUtils = require('./utils/DataUtils');
// const LibraryItem = require('./items/LibraryItem');

/**
 * Buffer our the javascript
 * @class Renderer
 * @constructor
 * @param {Library} library The library instance
 */
const Renderer = function(library)
{
    /**
     * Instance to the library
     * @property {Library} library
     */
    this.library = library;

    /**
     * The map of snippets already loaded
     * @property {Object} _snippets
     * @private
     */
    this._snippets = {};

    /**
     * If we should use the shortened compressed names
     * @property {Boolean} compress
     */
    this.compress = library.meta.compressJS;

    /**
     * The name of the stage item
     * @property {String} stageName
     */
    this.stageName = library.meta.stageName;

    /**
     * How the output should be handled.
     * @property {string} outputFormat
     */
    this.outputFormat = library.meta.outputFormat;

    /**
     * If the main stage should loop
     * @property {Boolean} loopTimeline
     */
    this.loopTimeline = library.meta.loopTimeline;

    /**
     * Override to the snippets folder (to which the version will be appended)
     * @property {String} snippetsPath
     */
    this.snippetsPath = '';
};

// Reference to the prototype
const p = Renderer.prototype;

/**
 * Add the template to the buffer
 * @method template
 * @private
 * @param {string} type The name of the template
 * @param {String|Object} subs The content or the map of config files
 */
p.template = function(type, subs)
{
    let buffer = this._snippets[type] || null;

    if (!buffer)
    {
        // Load the snippet from the file system
        buffer = fs.readFileSync(path.join(this.snippetsPath, '2.0', type + '.txt'), 'utf8');
        this._snippets[type] = buffer;
    }

    // Default the token to be content if subs is a string
    if (typeof subs == "string")
    {
        subs = {content: subs};
    }

    if (subs)
    {
        // Add a global extend method
        subs.extend = this.compress ? 'e' : 'extend';

        // Replace the variables with the map
        for (let prop in subs)
        {
            let search = new RegExp("\\$\\{"+prop+"\\}", 'g');
            let value = subs[prop];

            if (typeof value == "object")
            {
                value = DataUtils.stringifySimple(value);
            }
            buffer = buffer.replace(search, value);
        }
    }
    return buffer;
};

/**
 * Create the header list of classes
 * @method getHeader
 * @private
 * @return {string} Header buffer
 */
p.getHeader = function()
{
    let classes = "";

    if (this.library.hasContainer)
    {
        classes += "const Container = animate.Container;\n";
    }

    if (this.library.bitmaps.length)
    {
        classes += "const Sprite = animate.Sprite;\n";
    }

    if (this.library.texts.length)
    {
        classes += "const Text = animate.Text;\n";
    }

    if (this.library.shapes.length)
    {
        classes += "const Graphics = animate.Graphics;\n";
    }

    const meta = this.library.meta;
    // Get the header
    return this.template('header', {
        version: 2.0,
        stageName: meta.stageName,
        width: meta.width,
        height: meta.height,
        framerate: meta.framerate,
        totalFrames: this.library.stage.totalFrames,
        background: "0x" + meta.background,
        classes: classes,
        import: this.outputFormat === 'es6a' ? "import animate from 'pixi-animate';\n" : '',
        assets: JSON.stringify(this.library.stage.assets, null, '\t')
    });
};

/**
 * Get the timelines
 * @method getTimelines
 * @private
 * @return {string} timelines buffer
 */
p.getTimelines = function()
{
    let buffer = "";
    const renderer = this;
    for (const timeline of this.library.timelines)
    {
        buffer += timeline.render(renderer);
    }
    return buffer;
};


/**
 * Get the footer
 * @method getFooter
 * @private
 * @return {string} Footer buffer
 */
p.getFooter = function()
{
    return this.template('footer', {stageName: this.library.meta.stageName});
};

/**
 * Create the buffer and save it
 * @method render
 * @return {string} buffer
 */
p.render = function()
{
    let buffer = "";
    buffer += this.getHeader();
    buffer += this.getTimelines();
    buffer += this.getFooter();
    if (this.outputFormat === 'cjs') {
        buffer += this.template('commonjs');
    }
    else
    {
        let content = "";
        if (this.outputFormat === 'es6a') {
            // run setup, export results
            content = "data.setup(animate);\n";
            for (const id in this.library._mapById) {
                const item = this.library._mapById[id];
                if (item.name) {// && item instanceof LibraryItem) {
                    content += "const " + item.name + " = data.lib." + item.name + ";\nexport {" + item.name + "};\n";
                }
            }
        }
        buffer += this.template('module', content);
    }
    return buffer;
};

/**
 * Don't use after this
 * @method destroy
 */
p.destroy = function()
{
    this.library = null;
    this._snippets = null;
};

module.exports = Renderer;