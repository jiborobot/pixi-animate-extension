"use strict";

// Node modules
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const Library = require('./Library');
const Renderer = require('./Renderer');
const RendererLegacy = require('./RendererLegacy');
const DataUtils = require('./utils/DataUtils');
const SpritesheetBuilder = require('./SpritesheetBuilder');
const globalLog = require('./globalLog');

/**
 * The application to publish the JSON data to JS output buffer
 * @class Publisher
 */
let Publisher = function(dataFile, compress, debug, assetsPath)
{
    // Change the current directory
    process.chdir(path.dirname(dataFile));

    /**
     * The data file to delete
     * @property {string} _dataFile
     */
    this._dataFile = dataFile;

    /**
     * The data published from Flash
     * @property {Object} _data
     * @private
     */
    this._data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

    let outputFile = path.join(process.cwd(), this._data._meta.outputFile + 'on');
    fs.writeFileSync(outputFile, JSON.stringify(this._data, null, 4));

    // override the compress
    if (compress)
    {
        this._data._meta.compressJS = true;
    }

    /**
     * The library of assets to publish
     * @property {Library} library
     */
    this.library = new Library(this._data, this._data._meta.outputVersion != '1.0');

    /**
     * The composer to render output
     * @property {Renderer} composer
     */
    this.renderer = this._data._meta.outputVersion == '1.0' ? new RendererLegacy(this.library) : new Renderer(this.library);

    /**
     * If we are running in debug mode
     * @property {Boolean} debug
     */
    this.debug = debug == undefined ? false : debug;

    /**
     * The path to the assets
     * @property {String} assetsPath
     */
    this.assetsPath = assetsPath;
};

// Reference to the prototype
let p = Publisher.prototype;

/**
 * Export the assets
 * @method exportAssets
 */
p.exportAssets = function(done)
{
    let assetsToLoad = this.library.stage.assets;

    // Get the images to export
    this.library.bitmaps.forEach(function(bitmap)
    {
        assetsToLoad[bitmap.name] = bitmap.src;
    });

    // Get the sounds to export
    this.library.sounds.forEach(function(sound)
    {
        assetsToLoad[sound.name] = sound.src;
    });

    const shapes = this.library.shapes;
    const meta = this._data._meta;

    // No shapes, nothing to do here
    if (!meta.imagesPath) {
        return done();
    }

    if (shapes.length)
    {
        // The output map of graphics
        let buffer = "";
        let filename;

        if (!meta.compactShapes)
        {
            filename = meta.stageName + ".shapes.json";
            let results = [];
            shapes.forEach(function(shape)
            {
                results.push(shape.draw);
            });
            buffer = DataUtils.readableShapes(results);
        }
        else
        {
            filename = meta.stageName + ".shapes.txt";
            shapes.forEach(function(shape, i)
            {
                buffer += shape.toString();

                // Separate each shape with a new line
                if (i < shapes.length - 1)
                    buffer += "\n";
            });
        }

        // Create the directory if it doesn't exist
        const baseUrl = path.resolve(process.cwd(), meta.imagesPath);
        mkdirp.sync(baseUrl);

        // Save the file data
        fs.writeFileSync(path.join(baseUrl, filename), buffer);

        // Add to the assets
        assetsToLoad[meta.stageName] = meta.imagesPath + filename;
    }

    if (meta.spritesheets && this.library.bitmaps.length)
    {
        // Create the builder
        new SpritesheetBuilder({
                assets: assetsToLoad,
                output: meta.imagesPath + meta.stageName + '_atlas_',
                size: meta.spritesheetSize,
                scale: meta.spritesheetScale || 1,
                debug: this.debug
            },
            this.assetsPath,
            (assets) => {
                this.library.stage.assets = assets;
                done();
            }
        );
    }
    else
    {
        done();
    }
};

/**
 * Clean the stage
 * @method destroy
 */
p.destroy = function()
{
    if (!this.debug)
    {
        fs.unlinkSync(this._dataFile);
    }
    this._data = null;

    this.library.destroy();
    this.library = null;

    this.renderer.destroy();
    this.renderer = null;
};

/**
 * The main entry point for the publisher
 * @method run
 */
p.run = function(done)
{
    try {
        this.exportAssets(() => {
            try {
                this.publish((err, buffer) => {
                    if (err) {
                        return done(err);
                    }
                    this.destroy();
                    if (this.debug) {
                        buffer.split('\n').forEach((line) => {
                            console.log(line);
                        });
                    }
                    done();
                });
            }
            catch(e) {
                done(e);
            }
        });
    }
    catch(e) {
        done(e);
    }
};

/**
 * Save the output stream
 * @method publish
 */
p.publish = function(done)
{
    const meta = this._data._meta;

    // Get the javascript buffer
    let buffer = this.renderer.render();

    const debug = this.debug;

    const write = function()
    {
        // Save the output file
        let outputFile = path.join(process.cwd(), meta.outputFile);
        fs.writeFileSync(outputFile, buffer);

        if (debug && globalLog.length)
        {
            fs.writeFileSync(path.join(path.dirname(outputFile), 'log.txt'), globalLog.join('\n'));
        }

        done(null, buffer);
    }

    if (meta.compressJS)
    {
        // Run through terser
        const Terser = require('terser');
        Terser.minify(buffer, {module: meta.outputVersion !== '1.0', ecma: meta.outputVersion === '1.0' ? 5 : 2015})
        .then((result) => {
            if (result.error)
            {
                done(result.error);
            }
            else
            {
                buffer = result.code;
                write();
            }
        })
        .catch(done);
    }
    else
    {
        // Run through js beautifier
        const beautify = require('js-beautify').js_beautify;
        buffer = beautify(buffer, {
            indent_size: 4,
            preserve_newlines: true,
            space_after_anon_function: true,
            brace_style: "collapse-preserve-inline",
            break_chained_methods: true
        });
        write();
    }
};

module.exports = Publisher;