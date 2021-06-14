"use strict";

const Tween = require("./Tween");

/**
 * An object describing a single geometric tween
 * @class TimelineTween
 * @constructor
 * @param {Object} timeline The data for an individual tween.
 */
const TimelineTween = function (timeline) {

    /**
     * The name of the library item that these tweens are inside.
     * @property {string} name
     */
    this.name = timeline.timelineName;

    /**
     * Dictionary of Tween objects keyed by start frame.
     * @property {Object} tweensByStartFrame
     */
    this.tweensByStartFrame = {};

    for (const data of timeline.tweens)
    {
        const tween = new Tween(data);
        if (!this.tweensByStartFrame[tween.startFrame])
        {
            this.tweensByStartFrame[tween.startFrame] = [];
        }
        this.tweensByStartFrame[tween.startFrame].push(tween);
    }
};

// Extends the prototype
// const p = TimelineTween.prototype;

module.exports = TimelineTween;