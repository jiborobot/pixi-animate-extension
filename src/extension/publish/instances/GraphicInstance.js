"use strict";

const util = require('util');
const Instance = require('./Instance');

// const INDEPENDENT = 0;
const SYNCHED = 2;

/**
 * The Graphic object
 * @class GraphicInstance
 * @extends Instance
 * @constructor
 * @param {LibraryItem} libraryItem The bitmap data
 * @param {int} id
 */
const GraphicInstance = function(libraryItem, id)
{
    Instance.call(this, libraryItem, id);

    this.mode = SYNCHED;
};

// Extends the prototype
util.inherits(GraphicInstance, Instance);
const p = GraphicInstance.prototype;

/**
 * Render the element
 * @method render
 * @param {Renderer} renderer
 * @return {string} Buffer of object
 */
p.renderContent = function(renderer)
{
    let mode = this.mode;
    if (!renderer.compress)
    {
        mode = "MovieClip.SYNCHED";
    }
    return renderer.template('graphic-instance', {
        id: this.libraryItem.name,
        mode: mode
    });
};

module.exports = GraphicInstance;