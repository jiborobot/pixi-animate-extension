"use strict";

const Bitmap = require('./items/Bitmap');
const Shape = require('./items/Shape');
const Text = require('./items/Text');
const Timeline = require('./items/Timeline');
const Container = require('./items/Container');
const Stage = require('./items/Stage');
const Graphic = require('./items/Graphic');
const Sound = require('./items/Sound');
const TimelineTween = require('./data/TimelineTweens');

/**
 * Handle the converting of data assets to typed objects
 * @class Library
 */
const Library = function(data, doTweens)
{
    /**
     * The collection of Bitmap objects
     * @property {Array} bitmaps
     */
    const bitmaps = this.bitmaps = [];

    /**
     * The collection of Sound objects
     * @property {Array} sounds
     */
    const sounds = this.sounds = [];

    /**
     * The collection of Shape objects
     * @property {Array} shapes
     */
    const shapes = this.shapes = [];

    /**
     * The collection of Text objects
     * @property {Array} texts
     */
    const texts = this.texts = [];

    /**
     * The collection of Timeline objects
     * @property {Array} timelines
     */
    const timelines = this.timelines = [];

    /**
     * The look-up of the asset by ID
     * @property {Object} timelineTweensById
     */
    this.timelineTweensById = {};

    /**
     * The look-up of the asset by ID
     * @property {Object} _mapById
     * @private
     */
    const map = this._mapById = {};

    /**
     * The look-up of the asset by name
     * @property {Object} _mapByName
     * @private
     */
    const names = this._mapByName = {};

    /**
     * Instance of the main stage to use
     * @property {Stage} stage
     */
    this.stage = null;

    /**
     * The build settings
     * @property {Object} meta
     */
    this.meta = data._meta;

    /**
     * If there are non-animated display containers
     * @property {Boolean} hasContainer
     * @default
     */
    this.hasContainer = false;

    const library = this;

    // Convert the bitmaps
    data.Bitmaps.forEach(function(bitmapData)
    {
        const bitmap = new Bitmap(library, bitmapData);
        bitmaps.push(bitmap);
        map[bitmap.assetId] = bitmap;
    });

    // Convert the shapes
    data.Shapes.forEach(function(shapeData, id)
    {
        const shape = new Shape(library, shapeData);
        shape.id = id;
        shapes.push(shape);
        map[shape.assetId] = shape;
    });

    // Convert the sounds
    data.Sounds.forEach(function(soundData)
    {
        const sound = new Sound(library, soundData);
        sounds.push(sound);
        map[sound.assetId] = sound;
    });

    // Convert the shapes
    data.Texts.forEach(function(textData)
    {
        const text = new Text(library, textData);
        texts.push(text);
        map[text.assetId] = text;
    });

    // Sort the tweens
    if (doTweens)
    {
        for (const timeline of data.Tweens)
        {
            const tween = new TimelineTween(timeline);
            this.timelineTweensById[tween.name] = tween;
        }
    }

    let self = this;
    let timelineNames = data.Timelines.map(timelineData => timelineData.name);
    let graphics = 0;
    for(let timelineData of data.Timelines){
        if(timelineData.frames && timelineData.frames.length){
            for(let frame of timelineData.frames){
                if(frame.commands && frame.commands.length){
                    for(let command of frame.commands){
                        if(command.type === 'Place' && command.isGraphic){
                            let asset = data.Timelines.find(data => data.assetId === command.assetId);
                            if(asset.type !== 'graphic'){
                                asset.type = 'graphic';
                                let name = `Graphic${++graphics}`;
                                while(timelineNames.includes(name)){
                                    name = `Graphic${++graphics}`;
                                }
                                asset.name = name;
                            }
                        }
                    }
                }
            }
        }
    }
    data.Timelines.forEach(function(timelineData)
    {
        let timeline;

        if (timelineData.totalFrames <= 1 && timelineData.type != Timeline.STAGE)
        {
            self.hasContainer = true;
            timeline = new Container(library, timelineData);
        }
        else if (timelineData.type == Timeline.GRAPHIC)
        {
            timeline = new Graphic(library, timelineData);
        }
        else if (timelineData.type == Timeline.STAGE)
        {
            self.stage = timeline = new Stage(library, timelineData, data._meta.framerate);
        }
        else
        {
            timeline = new Timeline(library, timelineData);
        }
        timelines.push(timeline);

        // Graphic names are local, we only care about global names
        // so that we don't create conflicts
        if (timeline.type == Timeline.MOVIE_CLIP)
        {
            const exp = /_[0-9]+$/;

            let name = timeline.name;

            // See if timeline exists or if name is the same as stage
            while(names[name] || name == data._meta.stageName)
            {
                let version;

                // Increment the version
                if (exp.test(name))
                {
                    name = name.split('_');
                    version = parseInt(name.pop()) + 1;
                    name = name.join('_');
                }
                else
                {
                    version = 1;
                }
                name += "_" + version.toString();
            }
            // Remember the names for the next
            names[name] = timeline;

            // Update the name, just in case
            timeline.name = name;
        }
        map[timeline.assetId] = timeline;
    });
};

// Reference to the prototype
const p = Library.prototype;

/**
 * Get an object by id
 * @method createInstance
 * @param {int} assetId The Global asset id
 * @return {Instance} The instance object
 */
p.createInstance = function(assetId, instanceId)
{
    const libraryItem = this._mapById[assetId];
    return libraryItem.create(instanceId);
};

/**
 * Don't use after this
 * @method destroy
 */
p.destroy = function()
{
    this.shapes.length = 0;
    this.shapes = null;

    this.bitmaps.length = 0;
    this.bitmaps = null;

    this._mapById = null;
};

module.exports = Library;