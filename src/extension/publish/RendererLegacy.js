"use strict";

const path = require('path');
const fs = require('fs');
const DataUtils = require('./utils/DataUtils');

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
     * The namespace for the javascript
     * @property {String} nameSpace
     */
    this.nameSpace = library.meta.nameSpace;

    /**
     * The name of the stage item
     * @property {String} stageName
     */
    this.stageName = library.meta.stageName;

    /**
     * If the output should be Common JavaScript compatible
     * @property {Boolean} commonJS
     */
    this.commonJS = library.meta.outputFormat === 'cjs';

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
        buffer = fs.readFileSync(path.join(this.snippetsPath, '1.0', type + '.txt'), 'utf8');
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
        classes += "var Container = PIXI.Container;\n";
    }

    if (this.library.bitmaps.length)
    {
        classes += "var Sprite = PIXI.Sprite;\n";
        classes += "var fromFrame = PIXI.Texture.fromFrame;\n";
    }

    if (this.library.texts.length)
    {
        classes += "var Text = PIXI.Text;\n";
    }

    if (this.library.shapes.length)
    {
        classes += "var Graphics = PIXI.Graphics;\n";
        classes += "var shapes = PIXI.animate.ShapesCache;\n"
    }

    // Get the header
    return this.template('header', classes);
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
    this.library.timelines.forEach(function(timeline)
    {
        buffer += timeline.render(renderer);
    });
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
    return this.template('footer', this.nameSpace);
};

/**
 * Create the buffer and save it
 * @method render
 * @return {string} buffer
 */
p.render = function()
{
    const meta = this.library.meta;
    let buffer = "";
    buffer += this.getHeader();
    buffer += this.getTimelines();
    buffer += this.getFooter();
    if (this.commonJS) {
        buffer += this.template('commonjs', {
            nameSpace: this.nameSpace,
            stageName: meta.stageName,
            width: meta.width,
            height: meta.height,
            framerate: meta.framerate,
            totalFrames: this.library.stage.totalFrames,
            background: "0x" + meta.background
        });
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