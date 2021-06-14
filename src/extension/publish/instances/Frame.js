"use strict";

/**
 * The timeline frame object
 * @class Frame
 */
const Frame = function()
{
    // These are the values that can be animated
    this.a = null; // alpha
    this.t = null; // tint color (multiply)
    this.c = null; // colorTransform
    this.x = null; // x position
    this.y = null; // y position
    this.sx = null; // scale x value
    this.sy = null; // scale y value
    this.kx = null; // skew x value
    this.ky = null; // skew y value
    this.r = null; // rotation value
    this.v = null; // visibility
    this.bounds = null; // bounds

    // can't be animated, but is attached to frames to make implementation easier
    this.tween = null;
};

// Extends the prototype
const p = Frame.prototype;

/**
 * The map of local keys to global keys, used when serializing
 * @property {Object} GLOBAL_MAP
 * @static
 * @private
 */
const GLOBAL_MAP = {
    x: 'X',
    y: 'Y',
    sx: 'A',
    sy: 'B',
    kx: 'C',
    ky: 'D',
    r: 'R',
    a: 'L',
    t: 'T',
    c: 'F',
    v: 'V'
};

/**
 * The default values for all frames
 * @property {Object} defaultValues
 * @static
 */
Frame.DEFAULT_VALUES = {
    c: [1,0,1,0,1,0], // colorTransform
    a: 1, // alpha
    r: 0, // rotation
    x: 0, // x position
    y: 0, // y position
    sx: 1, // scale x
    sy: 1, // scale y
    kx: 0, // skew x
    ky: 0, // skew y
    v: 1 // visibility
};

/**
 * Add a command to the frame
 * @method addCommand
 * @param {Command} command
 */
p.addCommand = function(command)
{
    // Add the commands to this frame
    command.toFrame(this);
};

p.addTween = function(tween)
{
    this.tween = tween;
}

/**
 * If the frame has set values
 * @property {Boolean} hasValues
 */
Object.defineProperty(p, 'hasValues',
{
    get: function()
    {
        if (this.tween) return true;
        for (let k in GLOBAL_MAP)
        {
            if (this[k] !== null) return true;
        }
        return false;
    }
});

/**
 * If the frame has set values
 * @property {Array} hasValues
 */
Object.defineProperty(p, 'validKeys',
{
    get: function()
    {
        let validKeys = [];
        for (let k in GLOBAL_MAP)
        {
            if (this[k] !== null)
            {
                validKeys.push(k);
            }
        }
        return validKeys;
    }
});

/**
 * Remove properties
 * @method clean
 * @param {Array<String>} usedProperties
 */
p.clean = function(usedProperties)
{
    // Update the initial frame with all the properites that are animated
    for (let k in GLOBAL_MAP)
    {
        // If not in the properties we're animate
        // then mreove
        if (usedProperties.indexOf(k) == -1)
        {
            this[k] = null;
        }
    }
};

/**
 * Render the frame as static, no animation
 * @method render
 */
p.render = function(renderer)
{
    let buffer = "";
    const args = this.toTransform();
    const compress = renderer.compress;
    if (args.length)
    {
        const func = compress ? 't' : 'setTransform';
        buffer += `.${func}(${args.join(', ')})`;
    }

    if (this.a !== null && this.a < 1)
    {
        const func = compress ? 'a' : 'setAlpha';
        buffer += `.${func}(${this.a})`;
    }
    if (this.t !== null && this.t != "#fff")
    {
        const func = compress ? 'i': 'setTint';
        buffer += `.${func}("${this.t}")`;
    }
    else if (this.c && !isDefaultColorTransform(this.c))
    {
        const func = compress ? 'c': 'setColorTransform';
        buffer += `.${func}(${this.c.join(',')})`;
    }
    return buffer;
};

function isDefaultColorTransform(c) {
    for(let i = 0; i < c.length; i++) {
        if (c[i] !== Frame.DEFAULT_VALUES.c[i]) {
            return false;
        }
    }
    return true;
}

/**
 * Render the object as a string
 * @method toTransform
 * @param {Array} args List of values, e.g., `[
        this.x,
        this.y,
        this.scaleX,
        this.scaleY,
        this.rotation,
        this.skewX,
        this.skewY
    ]`
 * @return {Array} list of arguments in x, y, scaleX, scaleY, rotation, skewX, skewY
 */
p.toTransform = function()
{
    // The default values for transform
    const defaults = [0, 0, 1, 1, 0, 0, 0];

    const args = [
        this.x,
        this.y,
        this.sx,
        this.sy,
        this.r,
        this.kx,
        this.ky
    ];

    let toRemove = 0;
    for (let i = defaults.length - 1; i >= 0; i--)
    {
        if (args[i] == defaults[i])
        {
            toRemove++;
            continue;
        }
        break;
    }

    // Remove the default arguments
    if (toRemove > 0 && toRemove <= args.length)
    {
        args.splice(args.length - toRemove, toRemove);
    }
    return args;
};

/**
 * Serialize the frame properties
 * @method serialize
 * @return {string} buffer out
 */
p.serialize = function()
{
    let buffer = "";
    for (let k in GLOBAL_MAP)
    {
        if (this[k] !== null && this[k] !== undefined)
        {
            buffer += Frame.serializeProperty(k, this[k]);
        }
    }
    if (this.tween)
    {
        buffer += this.tween.serialize();
    }
    return Frame.trimSerializedNumbers(buffer);
};

/**
 * Convert the current object to JSON
 * @return {object} json
 */
p.toJSON = function()
{
    var result = {};
    for (let k in GLOBAL_MAP)
    {
        if (this[k] !== null)
        {
            result[k] = this[k];
        }
    }
    if (this.tween)
    {
        result.tw = this.tween.toJSON();
    }
    return result;
};

/**
 * Convert the frame to a string
 * @method toString
 * @return {String}
 */
p.toString = function()
{
    return JSON.stringify(this.toJSON());
};

Frame.serializeProperty = function(name, value)
{
    return GLOBAL_MAP[name] + value;
}

Frame.trimSerializedNumbers = function(buffer)
{
    return buffer.replace(/([A-Z])(\-)?0\./g, "$1$2.") // remove 0 from floats 0.12 => .12
}


module.exports = Frame;