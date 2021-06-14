"use strict";

const DataUtils = require('../utils/DataUtils');
const Frame = require('../instances/Frame');
const Matrix = require('./Matrix');

function areArraysDifferent(arr1, arr2)
{
    // if an array doesn't exist, something went wrong but we should not create a prop for it
    if (!arr1 || !arr2) return false;

    for (let i = 0; i < arr1.length; ++i)
    {
        if (arr1[i] !== arr2[i]) return true;
    }
    return false;
}

const TweenProp = function(data, degToRad, invert)
{
    if (typeof data.start === "number")
    {
        if (degToRad)
        {
            this.start = round(data.start * Math.PI / 180);
            this.end = round(data.end * Math.PI / 180);
        }
        else
        {
            this.start = round(data.start);
            this.end = round(data.end);
        }
        // it seems that to convert the skewX values, we need to make it negative
        if (invert)
        {
            this.start = -this.start;
            this.end = -this.end;
        }
    }
    else
    {
        this.start = data.start;
        this.end = data.end;
    }
    this.easeType = data.easeType;
    this.easeStrength = data.easeStrength;
}

/**
 * An object describing a single geometric tween
 * @class Tween
 * @constructor
 * @param {Object} tween The data for an individual tween.
 */
const Tween = function (tween) {

    /**
     * If this tween has been used by an instance. If so, it can't be matched with another one
     * (to ensure that tweens with duplicate start/end positions are treated separately)
     */
    this.used = false;
    /**
     * The start frame for the tween
     * @property {number} startFrame
     */
    this.startFrame = tween.start;

    /**
     * The end frame for the tween
     * @property {number} endFrame
     */
    this.endFrame = tween.end;

    /**
     * Transformation matrix for the start frame of the tween, used for matching up tweens and display objects.
     * @property {Matrix} startTransform
     */
    this.startTransform = new Matrix(tween.startTransform);

    /**
     * The x position tween data
     * @property {Object} x
     */
    this.x = tween.x ? new TweenProp(tween.x) : null;

    /**
     * The y position tween data
     * @property {Object} y
     */
    this.y = tween.y ? new TweenProp(tween.y) : null;

    /**
     * The scaleX tween data
     * @property {Object} scaleX
     */
    this.scaleX = tween.scaleX ? new TweenProp(tween.scaleX) : null;

    /**
     * The scaleY tween data
     * @property {Object} scaleY
     */
    this.scaleY = tween.scaleY ? new TweenProp(tween.scaleY) : null;

    /**
     * The skewX tween data
     * @property {Object} skewX
     */
    this.skewX = tween.skewX ? new TweenProp(tween.skewX, true, true) : null;

    /**
     * The skewY tween data
     * @property {Object} skewY
     */
    this.skewY = tween.skewY ? new TweenProp(tween.skewY, true) : null;

    /**
     * The rotation tween data
     * @property {Object} rotation
     */
    this.rotation = tween.rotation ? new TweenProp(tween.rotation, true) : null;

    /**
     * Ease object with name and strength properties.
     * @property {Object} ease
     */
    this.ease = this.isSharedEase() ? this.getFirstEase() : null;
};

// Extends the prototype
const p = Tween.prototype;

/**
 * Adds color info for first & last frames, as they aren't included in the geometric tween data.
 * @method addColors
 * @param {object} startColor Object with "c" and "a" properties, as on a frame.
 * @param {object} endColor Object with "c" and "a" properties, as on a frame.
 */
p.addColors = function(startColor, endColor)
{
    if (startColor.a !== endColor.a)
    {
        this.alpha = new TweenProp({start: startColor.a, end: endColor.a});
    }
    if (areArraysDifferent(startColor.c, endColor.c))
    {
        this.color = new TweenProp({start: startColor.c, end: endColor.c});
    }
}

p.replaceColorWithTint = function(startTint, endTint)
{
    this.color = null;
    this.tint = new TweenProp({start: startTint, end: endTint});
}

/**
 * Outputs a simplified JSON output
 * @method toJSON
 * @return {object} JSON output
 */
p.toJSON = function()
{
    const output = {
        d: this.endFrame - this.startFrame,
        p: {},
        e: this.ease ? {n: this.ease.name, s: this.ease.name === 'classic' ? this.ease.strength : undefined} : undefined,
    };
    const propNames = {
        x: 'x',
        y: 'y',
        scaleX: 'sx',
        scaleY: 'sy',
        rotation: 'r',
        skewX: 'kx',
        skewY: 'ky',
        alpha: 'a',
        color: 'c',
        tint: 't',
    };
    for (const prop in propNames)
    {
        if (this[prop])
        {
            output.p[propNames[prop]] = this[prop].end;
            if (!this.ease && this[prop].easeType)
            {
                const ease = this.getEaseJSON(this[prop]);
                if (!ease) continue;
                if (!output.p.e) output.p.e = {};
                output.p.e[propNames[prop]] = ease;
            }
        }
    }
    return output;
};

/**
 * Serialize the tween properties
 * @method serialize
 * @return {string} buffer out
 */
p.serialize = function()
{
    let buffer = 'WD' + (this.endFrame - this.startFrame);
    if (this.ease)
    {
        buffer += 'E' + (this.ease.name === 'classic' ? this.ease.strength : '') + this.ease.name + ';';
    }
    // start the property list
    buffer += 'P';
    const props = this.toJSON().p;
    for (const name in props)
    {
        // don't serialize the property ease grouping
        if (name == 'e') continue;
        buffer += Frame.trimSerializedNumbers(Frame.serializeProperty(name, props[name]));
        // after each property, serialize its ease if present
        if (props.e && props.e[name])
        {
            const ease = props.e[name];
            buffer += 'E' + (ease.n === 'classic' ? ease.s : '') + ease.n + ';';
        }
    }

    return buffer;
}

/**
 * Gets the ease on the first property being tweened, as the runtime implementation currently
 * does not handle per-property easing.
 * @method getFirstEase
 * @return {Object} Ease data with type and strength properties
 */
p.getFirstEase = function()
{
    let shorthand = null;
    if (this.x) shorthand = this.getEaseJSON(this.x);
    else if (this.y) shorthand = this.getEaseJSON(this.y);
    else if (this.scaleX) shorthand = this.getEaseJSON(this.scaleX);
    else if (this.scaleY) shorthand = this.getEaseJSON(this.scaleY);
    else if (this.rotation) shorthand = this.getEaseJSON(this.rotation);
    else if (this.skewX) shorthand = this.getEaseJSON(this.skewX);
    else if (this.skewY) shorthand = this.getEaseJSON(this.skewY);
    // if using classic easing and 0 strength, it is linear and we can save
    if (!shorthand)
        return null;
    return {name: shorthand.n, strength: shorthand.s};
}

/**
 * Gets JSON shorthand for an ease, if present.
 * @method getEaseJSON
 * @param {TweenProp} tweenProp The property to read the ease from.
 * @return {Object|null} Object with 'n' and 's' properties for an ease.
 */
p.getEaseJSON = function(tweenProp)
{
    const out = {n: tweenProp.easeType, s: tweenProp.easeStrength};
    if (out.n == 'classic' && out.s == 0)
        return null;
    return out;
}

/**
 * Gets the ease on the first property being tweened, as the runtime implementation currently
 * does not handle per-property easing.
 * @method isSharedEase
 * @return {boolean} If a single ease is shared among all properties.
 */
p.isSharedEase = function()
{
    let easeType = null;
    let easeStrength = null;
    const props = ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'skewX', 'skewY'];
    for (let i = 0; i < props.length; ++i)
    {
        if (!this[props[i]]) continue;
        if (!easeType)
        {
            easeType = this[props[i]].easeType;
            easeStrength = this[props[i]].easeStrength;
        }
        else
        {
            if (easeType !== this[props[i]].easeType || easeStrength !== this[props[i]].easeStrength)
            {
                return false;
            }
        }
    }
    return true;
}

/**
 * Checks if a transform matches the start of the tween.
 * @method transformMatchesStart
 * @param {Frame} frame The matrix to compare against.
 * @return {boolean} If there is a match
 */
p.transformMatchesStart = function(frame)
{
    if (this.used || !this.startTransform || !frame) return false;

    if (this.startTransform.x !== frame.x) return false;
    if (this.startTransform.y !== frame.y) return false;
    if (this.startTransform.scaleX !== frame.sx) return false;
    if (this.startTransform.scaleY !== frame.sy) return false;
    if (this.startTransform.rotation !== frame.r) return false;
    if (this.startTransform.skewX !== frame.kx) return false;
    if (this.startTransform.skewY !== frame.ky) return false;
    return true;
};

/**
 * Checks if a transform matches the end of the tween.
 * @method transformMatchesEnd
 * @param {Matrix} matrix The matrix to compare against.
 * @return {boolean} If there is a match
 */
p.matrixMatchesEnd = function(matrix)
{
    if (this.x && this.x.end !== matrix.x) return false;
    if (this.y && this.y.end !== matrix.y) return false;
    if (this.scaleX && this.scaleX.end !== matrix.scaleX) return false;
    if (this.scaleY && this.scaleY.end !== matrix.scaleY) return false;
    if (this.rotation && this.rotation.end !== matrix.rotation) return false;
    if (this.skewX && this.skewX.end !== matrix.skewX) return false;
    if (this.skewY && this.skewY.end !== matrix.skewY) return false;
    return true;
};

function round(val) {
    return DataUtils.toPrecision(val, 3);
}

module.exports = Tween;