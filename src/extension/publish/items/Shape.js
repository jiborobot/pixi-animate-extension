"use strict";

const util = require('util');
const LibraryItem = require('./LibraryItem');
const ShapeInstance = require('../instances/ShapeInstance');
const DataUtils = require('../utils/DataUtils');


/**
 * The bitmap object
 * @class Shape
 * @extends LibraryItem
 * @constructor
 * @param {Object} data The bitmap data
 * @param {int} data.assetId The resource id
 * @param {int} data.paths The resource paths
 */
const Shape = function(library, data)
{
    // Add the data to this object
    LibraryItem.call(this, library, data);

    /**
     * The name of this shape
     * @property {string} name
     */
    this.name = "";

    let draw = [];

    // Conver the data into drawing commands
    for(let j = 0, len = this.paths.length; j < len; j++)
    {
        let path = this.paths[j];
        let gradient = path.radialGradient || path.linearGradient;

        // Adding a stroke
        if (path.stroke)
        {
            draw.push("f", 0, 0); // transparent fill
            let color, alpha;
            if (gradient)
            {
                color = this.toColor(gradient.stop[0].stopColor);
                alpha = gradient.stop[0].stopOpacity;
            }
            else
            {
                color = this.toColor(path.color);
                alpha = path.alpha;
            }
            draw.push("s", path.thickness, color, alpha);
        }
        else if (gradient)
        {
            draw.push("f",
                this.toColor(gradient.stop[0].stopColor),
                gradient.stop[0].stopOpacity
            );
        }
        else if (path.image) // bitmap fill as black
        {
            draw.push("f", 0, 1);
        }
        else // normal fills
        {
            draw.push("f", this.toColor(path.color), path.alpha);
        }

        path.d.forEach(function(command, k, commands)
        {
            if (typeof command == "number")
            {
                // round the number
                commands[k] = Math.round(command * 100) / 100;
            }
            // handle legacy format
            if (library.meta.outputVersion === '1.0')
            {
                // use old hole
                if (command === 'eh')
                {
                    commands[k] = 'h';
                }
                // use old close path
                else if (command === 'cp')
                {
                    commands[k] = 'c';
                }
            }
        });
        // further handle legacy format
        if (library.meta.outputVersion === '1.0') {
            // filter out any 'begin hole' commands, because those didn't exist then
            path.d = path.d.filter(v => v !== 'bh');
        }

        // Add the draw commands
        draw.push.apply(draw, path.d)
    }

    /**
     * The list of draw commands
     * @property {Array} draw
     */
    this.draw = draw;
};

// Reference to the prototype
util.inherits(Shape, LibraryItem);
const p = Shape.prototype;

/**
 * Compress colors
 * @method toColor
 * @private
 * @see DataUtils.compressColors
 */
p.toColor = function(hex)
{
    return DataUtils.compressColors(hex);
};

/**
 * Create a instance of this
 * @method create
 * @return {ShapeInstance} The new instance
 * @param {int} id Instance id
 */
p.create = function(id)
{
    return new ShapeInstance(this, id);
};

/**
 * @method toString
 * @return {string} the string of this
 */
p.toString = function()
{
    return this.draw.join(" ");
};

module.exports = Shape;