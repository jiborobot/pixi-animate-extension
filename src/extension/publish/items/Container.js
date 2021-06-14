"use strict";

const util = require('util');
const LibraryItem = require('./LibraryItem');
const ContainerInstance = require('../instances/ContainerInstance');
const SoundInstance = require('../instances/SoundInstance');
const Matrix = require('../data/Matrix');
const Command = require('../commands/Command');
// const globalLog = require('../globalLog');

/**
 * The single frame timeline
 * @class Container
 * @extends LibraryItem
 * @constructor
 * @param {Object} data The bitmap data
 * @param {int} data.assetId The resource id
 */
const Container = function(library, data)
{
    // Add the data to this object
    LibraryItem.call(this, library, data);

    /**
     * Get the instances by id
     * @property {Object} instancesMap
     */
    this.instancesMap = {};

    /**
     * The collection of masks
     * @property {Array} masks
     */
    this.masks = [];

    /**
     * Collection of instances to render (excluding masks)
     * @property {Array} children
     */
    this.children = [];

    /**
     * The children to add using .addChild()
     * these are static/non-animated
     * @property {Array} addChildren
     * @private
     */
    this.addChildren = [];

    // Get the children for this
    this.getChildren();
};

// Reference to the prototype
util.inherits(Container, LibraryItem);
const p = Container.prototype;

/**
 * Render the element
 * @method render
 * @param {Renderer} renderer
 * @return {string} Buffer of object
 */
p.render = function(renderer)
{
    return renderer.template('container', {
        id: this.name,
        contents: this.getContents(renderer)
    });
};

/**
 * Handler for the mask added event
 * @method onMaskAdded
 * @param {Mask} command Mask command
 * @param {int} frame index
 */
p.onMaskAdded = function(command, frame)
{
    const mask = this.instancesMap[command.instanceId];
    const instance = this.instancesMap[command.maskTill];
    // console.log("maskAdded", instance, mask, frame);
    this.masks.push({
        instance: instance,
        mask: mask,
        frame: frame
    });
};

/**
 * Handler for the mask removed event
 * @method onMaskRemoved
 * @param {Mask} command Mask command
 * @param {int} frame index
 */
p.onMaskRemoved = function(command, frame)
{
    const mask = this.instancesMap[command.instanceId];
    // console.log("maskRemoved", command, frame);
    this.masks.forEach(function(entry)
    {
        if (entry.mask === mask)
        {
            entry.duration = frame - entry.frame;
        }
    });
};

/**
 * Get the collection of children to place
 * @method getChildren
 * @return {array<Instance>} Collection of instance objects
 */
p.getChildren = function()
{
    const library = this.library;
    const instancesMap = this.instancesMap;
    const children = this.children;
    const onMaskAdded = this.onMaskAdded.bind(this);
    const onMaskRemoved = this.onMaskRemoved.bind(this);
    const tweens = this.library.timelineTweensById[this.name];
    const activeTweenInstances = {};
    const lastFrameReadForInstances = {};
    for (let i = 0; i < this.frames.length; ++i)
    {
        const frame = this.frames[i];
        // Ignore frames without commands
        if (!frame.commands)
        {
            continue;
        }
        frame.commands.forEach((command) =>
        {
            let instance = instancesMap[command.instanceId];

            if (!instance)
            {
                instance = library.createInstance(command.assetId, command.instanceId);
                instancesMap[command.instanceId] = instance;

                instance.on('maskAdded', onMaskAdded);
                instance.on('maskRemoved', onMaskRemoved);
            }

            // if we skipped frames, check to make sure we didn't need to start any tweens in the meantime
            // (due to frames not getting exported because easing meant no movement)
            if (lastFrameReadForInstances[command.instanceId] < frame.frame - 1)
            {
                // stop tracking any active tween that we skipped past the end of
                if (activeTweenInstances[command.instanceId] < frame.frame)
                {
                    delete activeTweenInstances[command.instanceId];
                }
                // if we aren't currently doing a tween, we should see if we needed to start one on one of those skipped frames
                if (!activeTweenInstances[command.instanceId])
                {
                    // save the transform on the last frame we did read (since we know it didn't change)
                    const transform = instance.getTransformForFrame(lastFrameReadForInstances[command.instanceId] + 1);
                    // go through each interim frame to see if there is a tween
                    for (let f = lastFrameReadForInstances[command.instanceId] + 1; f < frame.frame; ++f)
                    {
                        // check for the start of a new tween
                        if (tweens && tweens.tweensByStartFrame[f])
                        {
                            const frameTweens = tweens.tweensByStartFrame[f];
                            // go through each tween on this frame and see if this instance's geometry matches that of the tween
                            for (let j = 0; j < frameTweens.length; ++j)
                            {
                                if (frameTweens[j].transformMatchesStart(transform))
                                {
                                    const end = this.searchAheadForTweenEnd(command.instanceId, frameTweens[j], i);
                                    // if this instance matches the end geometry of the tween on the end frame, then assume this is the instance
                                    // that should be tweened
                                    if (end)
                                    {
                                        // consume the tween so that it can't be used by something else
                                        frameTweens[j].used = true;
                                        activeTweenInstances[command.instanceId] = end;
                                        // add the tween here
                                        instance.startTween(f, frameTweens[j]);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            lastFrameReadForInstances[command.instanceId] = frame.frame;

            // if there is a tween being processed for the given instance ignore the command and
            // look at the tween
            if ((command.type === 'Move' || command.type === 'Place') && activeTweenInstances[command.instanceId])
            {
                // if the current frame is the end frame of the active tween, we can call off that tween
                if (frame.frame === activeTweenInstances[command.instanceId])
                {
                    delete activeTweenInstances[command.instanceId];
                }
            }
            // otherwise handle the command normally
            else
            {
                // do some extra work to add color transforms into tweens
                if (command.type === 'ColorTransform')
                {
                    // get any tween ending on this frame, in case it already got cleaned up by the move
                    // and is no longer in the activeTweenInstances dictionary
                    // unfortunately, this is slow, but accurate since the colors are disconnected from any
                    // tween data
                    const activeTween = instance.getTweenEndingOnFrame(activeTweenInstances[command.instanceId]) || instance.getTweenEndingOnFrame(frame.frame);
                    // if no tween active or this is the start frame of the tween, add to keyframe normally
                    if (!activeTween || frame.frame === activeTween.startFrame)
                    {
                        // Add to the list of commands for this instance, will be added to the keyframe
                        instance.addToFrame(frame.frame, command);
                    }
                    else if (frame.frame === activeTween.endFrame)
                    {
                        const colors = {};
                        // record color data as it would be on the frame
                        Command.create(command).toFrame(colors);
                        // now add the start & end colors to the tween (if they are different)
                        activeTween.addColors(instance.frames[activeTween.startFrame], colors);
                    }
                }
                else
                {
                    // Add to the list of commands for this instance
                    instance.addToFrame(frame.frame, command);
                }
            }

            // check for the start of a new tween
            if (tweens && tweens.tweensByStartFrame[frame.frame])
            {
                const frameTweens = tweens.tweensByStartFrame[frame.frame];
                const transform = instance.getTransformForFrame(frame.frame);
                // go through each tween on this frame and see if this instance's geometry matches that of the tween
                for (let j = 0; j < frameTweens.length; ++j)
                {
                    if (frameTweens[j].transformMatchesStart(transform))
                    {
                        const end = this.searchAheadForTweenEnd(command.instanceId, frameTweens[j], i);
                        // if this instance matches the end geometry of the tween on the end frame, then assume this is the instance
                        // that should be tweened
                        if (end)
                        {
                            // consume the tween so that it can't be used by something else
                            frameTweens[j].used = true;
                            activeTweenInstances[command.instanceId] = end;
                            // add the tween here
                            instance.startTween(frame.frame, frameTweens[j]);
                            break;
                        }
                    }
                }
            }

            // Add it if it hasn't been added already
            if (!(instance instanceof SoundInstance) && children.indexOf(instance) == -1)
            {
                children.push(instance);
            }
        });
    }
};

/**
 * Searches ahead in the timeline to see if a given instance matches the end of a tween.
 * @method searchAheadForTweenEnd
 * @param {string} instanceId
 * @param {Tween} tween
 * @private
 */
p.searchAheadForTweenEnd = function(instanceId, tween, startIndex)
{
    let lastTransform = null;
    for (let i = startIndex + 1; i < this.frames.length; ++i)
    {
        // don't go past our target end frame
        if (this.frames[i].frame > tween.endFrame)
        {
            break;
        }
        // get the last transform applied, in case our target frame isn't present, due to easing causing it to not
        // be a change from previous frames
        let commands = this.frames[i].commands;
        for (let j = 0; j < commands.length; ++j)
        {
            if (commands[j].instanceId === instanceId && commands[j].type === 'Move')
            {
                lastTransform = commands[j].transform;
            }
        }
        // continue to not go past our target end frame
        if (this.frames[i].frame === tween.endFrame)
        {
            break;
        }
    }
    if (!lastTransform)
    {
        return null;
    }
    const testMatrix = new Matrix(lastTransform);
    if (tween.matrixMatchesEnd(testMatrix))
    {
        return tween.endFrame;
    }
    return null;
}

/**
 * Renderer to use
 * @method getContents
 * @param {Renderer} renderer
 */
p.getContents = function(renderer)
{
    let preBuffer = this.renderChildrenMasks(renderer);
    let buffer = this.renderChildren(renderer);
    let postBuffer = this.renderAddChildren(renderer);
    let output = preBuffer + buffer + postBuffer;

    //Support Container frame script
    if (!this._isTimeline && this.frames && this.frames[0])
    {
        let script = this.frames[0].scripts && this.frames[0].scripts[0];
        if (script)
        {
            script = script.replace(/\\n/g, "\n");
            output += script;
        }
    }

    return output;
};

p.renderAddChildren = function(renderer)
{
    let buffer = '';
    // Add the static children using addChild
    if (this.addChildren.length)
    {
        let func = renderer.compress ? 'ac' : 'addChild';
        buffer += `this.${func}(${this.addChildren.join(', ')});`;
    }
    return buffer;
};

/**
 * Convert instance to add child calls
 * @method renderChildrenMasks
 * @param {Renderer} renderer The reference to renderer
 */
p.renderChildrenMasks = function(renderer)
{
    const len = this.masks.length;
    let buffer = '';
    for(let i = 0; i < len; i++)
    {
        buffer += this.renderInstance(
            renderer,
            this.masks[i].mask
        );
    }
    return buffer;
};

/**
 *
 *
 */
p.flattenDepthItems = function(items)
{
    const result = [];

    // Pre-sort the items by startFrame
    items.sort(function(a, b)
    {
        return b.startFrame - a.startFrame;
    });

    for(let i = 0; i < items.length; i++)
    {
        let item = items[i];
        result.push(item.instance);

        if (item.children.length)
        {
            let children = this.flattenDepthItems(item.children);
            result.push.apply(result, children);
        }
    }
    return result;
};

/**
 * Convert instance to add child calls
 * @method renderChildren
 * @param {Renderer} renderer The reference to renderer
 * @return {string} Buffer of add children calls
 */
p.renderChildren = function(renderer)
{
    const len = this.children.length;
    let buffer = '';
    if (len)
    {
        let items = [];
        let cloned = this.children.slice(0);
        let map = {};

        // Find all of the top nodes with no layer
        for(let i = 0; i < len; i++)
        {
            let instance = this.children[i];
            if (!instance.placeAfter)
            {
                // Remove from the temporary list
                cloned.splice(cloned.indexOf(instance), 1);

                // Create a list item to link together instances
                let item = {
                    instance: instance.id,
                    startFrame: instance.startFrame,
                    placeAfter: 0,
                    children: []
                };
                map[instance.id] = item;
                items.push(item);
            }
        }
        // Go through the rest of the items and
        // add them to the depth sorted
        while(cloned.length)
        {
            for(let i = 0; i < cloned.length; i++)
            {
                let instance = cloned[i];
                let parent = map[instance.placeAfter];

                if (parent)
                {
                    // Remove from the list
                    cloned.splice(i, 1);

                    // Create a new linked item
                    let item = {
                        instance: instance.id,
                        startFrame: instance.startFrame,
                        placeAfter: instance.placeAfter,
                        children: []
                    };

                    // nest under the parent
                    parent.children.push(item);

                    // Sort the children by startTime
                    parent.children.sort(this.sortByStartFrame);

                    // Add to the map
                    map[instance.id] = item;
                    break;
                }
            }
        }

        // Flatted all the items to a single array of instances
        let depthSorted = this.flattenDepthItems(items);

        // Reverse the items to add in reverse order
        depthSorted.reverse();

        // Render to the stage
        for(let i = 0; i < depthSorted.length; i++)
        {
            let instance = this.instancesMap[depthSorted[i]];

            if (!instance.renderable) continue;

            buffer += this.renderInstance(renderer, instance);

        }
    }
    return buffer;
};

/**
 * Render either a mask or normal instance
 * @method renderInstance
 * @return {string}
 */
p.renderInstance = function(renderer, instance)
{
    this.addChildren.push(instance.localName);
    return instance.render(renderer, this.getMaskByInstance(instance));
};

/**
 * Get a mask for an instance
 * @method getMask
 * @param {Instance} instance
 * @return {Instance} The mask to use for instance
 */
p.getMaskByInstance = function(instance)
{
    for(let i = 0; i < this.masks.length; i++)
    {
        if (this.masks[i].instance === instance)
        {
            return this.masks[i].mask.localName;
        }
    }
    return null;
};

/**
 * Create a instance of this
 * @method create
 * @return {ContainerInstance} The new instance
 * @param {int} id Instance id
 */
p.create = function(id)
{
    return new ContainerInstance(this, id);
};

module.exports = Container;
