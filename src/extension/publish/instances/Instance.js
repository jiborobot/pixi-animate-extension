"use strict";

const Command = require('../commands/Command');
const Frame = require('./Frame');
const DataUtils = require('../utils/DataUtils');
const util = require('util');
const EventEmitter = require('events');

/**
 * The instance renderable object
 * @class Instance
 * @constructor
 * @param {LibraryItem} libraryItem
 */
const Instance = function(libraryItem, id)
{
    EventEmitter.call(this);

    /**
     * The unique instanceId within a timeline
     * @property {int} id
     */
    this.id = id;

    /**
     * The name of the item
     * @property {string} name
     */
    this.localName = "instance" + id;

    /**
     * The instance name, if named
     * @property {string} instanceName
     */
    this.instanceName = null;

    /**
     * The first frame to start showing
     * @property {int} startFrame
     * @default 0
     */
    this.startFrame = 0;

    /**
     * The number of frames to show
     * @property {int} endFrame
     * @default -1
     */
    this.endFrame = -1;

    /**
     * The library reference
     * @property {LibraryItem} libraryItem
     */
    this.libraryItem = libraryItem;

    /**
     * Initially place the item
     * @property {Frame} initFrame
     */
    this.initFrame = null;

    /**
     * Instance id to place after
     * @property {int} placeAfter
     */
    this.placeAfter = 0;

    /**
     * The collection of keyframes
     * @property {Object} frames
     * @private
     */
    this.frames = {};

    /**
     * If this should loop
     * @property {Boolean} loop
     */
    this.loop = false;

    /**
     * If this instance is serving as a mask
     * @property {Boolean} renderable
     * @default true
     */
    this.renderable = true;

    /**
     * If this instance is animated
     * @property {Boolean} isAnimated
     * @default false
     * @private
     */
    this.isAnimated = false;
};

// Reference the prototype
// Extends the prototype
util.inherits(Instance, EventEmitter);
const p = Instance.prototype;

/**
 * Add an command to the object
 * @method addToFrame
 * @param {int} frame Frame to add to
 * @param {Object} command Current command data
 */
p.addToFrame = function(frameIndex, command)
{
    // Convert into a typed command
    command = Command.create(command);

    if (command.type == "Place")
    {
        this.loop = !!command.loop;
        this.startFrame = frameIndex;
        if (!this.instanceName && command.instanceName)
            this.instanceName = command.instanceName;
        this.placeAfter = command.placeAfter;
    }
    else if (command.type == "Remove")
    {
        this.endFrame = frameIndex;
        if (!this.renderable)
        {
            this.emit('maskRemoved', command, frameIndex);
        }
    }
    else if (command.type == "Mask" && command.instanceId != command.maskTill)
    {
        this.renderable = false;
        this.emit('maskAdded', command, frameIndex);
    }

    let frame = this.frames[frameIndex];
    if (!frame)
    {
        frame = this.frames[frameIndex] = new Frame();
    }

    // The command should add properties to the current frame
    frame.addCommand(command);

    // Remove empty frames
    if (!Object.keys(frame).length)
    {
        delete this.frames[frameIndex];
    }
    else if (!this.initFrame)
    {
        this.initFrame = frame;
    }

    // Check to see if this is animated
    if (Object.keys(this.frames).length > 1)
    {
        this.isAnimated = true;
    }
};

p.startTween = function(frameIndex, tween)
{
    let frame = this.frames[frameIndex];
    if (!frame) {
        frame = this.frames[frameIndex] = new Frame();
    }
    frame.addTween(tween);
    this.isAnimated = true;
};

/**
 * Searches backwards to find the transformation values on a given frame.
 */
p.getTransformForFrame = function(frameIndex)
{
    let tweenResults = {};
    for (let i = frameIndex; i >= 0; --i)
    {
        const frame = this.frames[i];
        if (!frame) continue;

        if (frame.tween)
        {
            // take into account any tweens we see along the way as they change the ending frame values
            tweenResults = Object.assign({}, frame.tween.toJSON().p, tweenResults);
        }
        // if there is any transformation property, it has all of them and we just need to merge tween values
        if (frame.x !== null) return Object.assign({}, frame, tweenResults);
    }
    return null;
}

p.getTweenEndingOnFrame = function(frameIndex)
{
    if (!frameIndex) return null;

    for (let i = 0; i < frameIndex; ++i)
    {
        const frame = this.frames[i];
        if (!frame) continue;

        if (frame.tween && frame.tween.endFrame === frameIndex)
        {
            return frame.tween;
        }
    }
    return null;
}

/**
 * Get the duration of this item on the stage
 * @method getDuration
 * @param {int} totalFrames The total frames of parent
 * @return {int} Duration in frames
 */
p.getDuration = function(totalFrames)
{
    return this.endFrame > 0 ?
        this.endFrame - this.startFrame :
        totalFrames - this.startFrame;
};

/**
 * Remove values duplicated from the previous frame
 * @method getFrames
 * @param {Boolean} compress
 * @return {String|null} Either the collection of frames or null if no frames
 */
p.getFrames = function(compress)
{
    // If we're not animated, don't do anything
    if (!this.isAnimated)
    {
        return null;
    }

    let firstFrame;
    let prevFrame = Frame.DEFAULT_VALUES;

    const allKeys = Object.keys(prevFrame);

    let animProps = [];
    for (let index in this.frames)
    {
        let frame = this.frames[index];
        let cloneFrame = Object.assign({}, prevFrame, frame.toJSON());

        // Don't touch the first frame
        if (!firstFrame)
        {
            firstFrame = frame;

            // Check for non-default properties and add to the list of valid
            // animation properties
            frame.validKeys.forEach(function(k)
            {
                if (!equals(prevFrame[k], frame[k]) || (cloneFrame.tw && Object.prototype.hasOwnProperty.call(cloneFrame.tw.p, k)))
                {
                    animProps.push(k);
                }
            });
            prevFrame = cloneFrame;
            if (prevFrame.tw)
            {
                Object.assign(prevFrame, prevFrame.tw.p);
                delete prevFrame.tw;
            }
            continue;
        }

        // De-duplicate the animated properties
        for (let i = 0, len = allKeys.length; i < len; i++)
        {
            let k = allKeys[i];

            if (equals(prevFrame[k], frame[k]))
            {
                frame[k] = null;
            }
        }

        // Remove frames with no properties
        let keys = frame.validKeys;
        if (!keys.length && !frame.tween)
        {
            delete this.frames[index];
        }
        else
        {
            // Add the animated keys
            for (let i = 0; i < keys.length; i++)
            {
                let k = keys[i];
                if (animProps.indexOf(k) == -1)
                {
                    animProps.push(k);
                }
            }
        }

        // Property remember all the values of the current frame
        prevFrame = cloneFrame;
        if (prevFrame.tw)
        {
            Object.assign(prevFrame, prevFrame.tw.p);
            delete prevFrame.tw;
        }
    }

    // Clean props that we don't use
    firstFrame.clean(animProps);

    // No keyframes are animated
    if (!firstFrame.hasValues)
    {
        return null;
    }

    // Optimize the color transforms into simple tints
    DataUtils.optimizeColorTransforms(this.frames);

    if (compress)
    {
        let result = [];
        for (let i in this.frames)
        {
            result.push(i + this.frames[i].serialize());
        }
        return `"${result.join(' ')}"`;
    }
    else
    {
        return DataUtils.stringifySimple(this.frames);
    }
};

/**
 * Check that two values are equal.
 * @function equals
 * @private
 * @param {*} a
 * @param {*} b
 * @return {Boolean} Are equal
 */
function equals(a, b)
{
    if (a === b)
    {
        return true;
    }
    if (a === null || b === null)
    {
        return false;
    }

    if (!Array.isArray(a))
    {
        return a === b;
    }
    else
    {
        for(let i = 0; i < a.length; i++)
        {
            if (!equals(a[i], b[i]))
            {
                return false;
            }
        }
    }
    return true;
}

/**
 * Render the object as a string
 * @method renderBegin
 * @return {string} buffer
 */
p.renderBegin = function()
{
    // Add the instance name line
    const varWord = this.libraryItem.library.meta.outputVersion === "1.0" ? "var" : "const";
    return `${varWord} ${this.localName} = `;
};

/**
 * Render the object as a string
 * @method renderEnd
 * @param {Renderer} renderer
 * @return {string} buffer
 */
p.renderEnd = function(renderer)
{
    let buffer = '';
    if (!this.renderable)
    {
        const func = renderer.compress ? 're' : 'setRenderable';
        buffer += `.${func}(false)`;
    }
    if (!this.isAnimated && this.initFrame)
    {
        buffer += this.initFrame.render(renderer);
    }
    return buffer;
};

/**
 * Render the object as a string
 * @method renderContent
 * @param {Renderer} renderer
 * @return {string} buffer
 */
p.renderContent = function()
{
    throw "Must override";
};

/**
 * Render the object as a string
 * @method render
 * @param {Renderer} renderer
 * @param {String} mask Mask if we're single mode
 * @return {string} buffer
 */
p.render = function(renderer, mask)
{
    let buffer = "";
    buffer += this.renderBegin(renderer);
    buffer += this.renderContent(renderer);
    buffer += this.renderEnd(renderer);

    // Add a single frame mask
    if (mask)
    {
        const func = renderer.compress ? 'ma' : 'setMask';
        buffer += `.${func}(${mask})`;
    }

    // Add the instance name
    if (this.instanceName)
    {
        buffer += `; this[${this.localName}.name = "${this.instanceName}"] = ${this.localName}`;
    }
    return `${buffer};`;
};

module.exports = Instance;