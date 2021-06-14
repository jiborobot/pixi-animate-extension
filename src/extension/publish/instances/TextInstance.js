"use strict";

const util = require('util');
const Instance = require('./Instance');
const DataUtils = require('../utils/DataUtils');

/**
 * The text object
 * @class TextInstance
 * @extends Instance
 * @constructor
 * @param {Text} libraryItem
 * @param {int} id
 */
const TextInstance = function(libraryItem, id)
{
    // Add the data to this object
    Instance.call(this, libraryItem, id);

    this.paragraph = libraryItem.paras[0];
    this.style = this.paragraph.textRun[0].style;
    this.align = this.paragraph.alignment;

    /**
     * The name of the text instance
     * @property {String} instanceName
     */
    this.instanceName = libraryItem.behaviour.name || null;
};

// Reference to the prototype
util.inherits(TextInstance, Instance);
const p = TextInstance.prototype;

const STYLE_PROPS = {
    fontSize: 'z',
    fontFamily: 'f',
    fontStyle: 'y',
    fontWeight: 'g',
    fill : 'i',
    align : 'a',
    stroke : 's',
    strokeThickness : 't',
    wordWrap : 'w',
    wordWrapWidth : 'd',
    lineHeight : 'l',
    dropShadow : 'h',
    dropShadowColor : 'c',
    dropShadowAngle : 'n',
    dropShadowBlur : 'b',
    padding : 'p',
    textBaseline : 'x',
    lineJoin : 'j',
    miterLimit : 'm',
    letterSpacing : 'e'
};

/**
 * Render the element
 * @method render
 * @param {Renderer} renderer
 * @return {string} Buffer of object
 */
p.renderContent = function(renderer)
{
    const style = this.style;
    const options = {};
    const compress = renderer.compress;

    // Get the font style, remove the "Style"
    let fontStyle = style.fontStyle.replace('Style', '');

    // Convert names like "Arial Bold" to just "Arial"
    options.fontFamily = style.fontName.replace(' ' + fontStyle, '');
    options.fontSize = style.fontSize;

    fontStyle = fontStyle.toLowerCase();

    if (fontStyle == "italic")
        options.fontStyle = fontStyle;

    if (fontStyle == "bold")
        options.fontWeight = fontStyle;

    // Check for default color
    if (style.fontColor != "#000000")
        options.fill = DataUtils.compressColors(style.fontColor);

    // Add letterSpacing if we have it
    if (style.letterSpacing)
        options.letterSpacing = style.letterSpacing;

    // Add leading if specified
    if(this.paragraph.linespacing)
        options.leading = this.paragraph.linespacing;

    if (this.libraryItem.behaviour.lineMode === 'multi')
    {
        options.wordWrap = true;
        options.wordWrapWidth = this.initFrame.bounds.width;
    }

    // Replace the long names with the shortened names
    if (compress)
    {
        for(var k in STYLE_PROPS)
        {
            if (options[k] !== undefined)
            {
                options[STYLE_PROPS[k]] = options[k];
                delete options[k];
            }
        }
    }

    let buffer = renderer.template('text-instance', {
        text: (this.libraryItem.txt || "").replace(/"/g, "\\\"")
    });

    // Add the style setter
    let setStyle = compress ? 'ss' : 'setStyle';
    buffer += `.${setStyle}(${DataUtils.stringifySimple(options)})`;

    if (this.align != 'left')
    {
        // Add the special alignment
        const isCenter = this.align == 'center';
        const alignValue = isCenter ? 0 : 1;
        const func = compress ? 'g' : 'setAlign';
        const align = compress ? `${alignValue}` : `"${this.align}"`;
        buffer += `.${func}(${align})`;

        // Adjust the x position based on the bounds
        const width = this.initFrame.bounds.width * this.initFrame.sx;
        this.initFrame.x += isCenter ? width / 2 : width;
        this.initFrame.x += this.initFrame.bounds.x * this.initFrame.sx;
        this.initFrame.y += this.initFrame.bounds.y * this.initFrame.sy;
    }
    return buffer;
}

module.exports = TextInstance;
