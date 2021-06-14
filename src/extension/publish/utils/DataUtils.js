"use strict";

/**
 * Data utilities
 * @class DataUtils
 */
var DataUtils = {

    /**
     * Round a number to decimal places
     * @method toPrecision
     * @param {Number} val Number to round
     * @param {int} [places=2] Number of decimal places to round to
     * @return {Number} Rounded number
     */
    toPrecision: function(val, places)
    {
        places = places || 2;
        const num = Math.pow(10, places);
        return Math.round(val * num) / num;
    },

    /**
     * Replace the key names with un-quoted strings
     * @method stringifySimple
     * @static
     * @param {Object} json
     * @return {String} Output stringify
     */
    stringifySimple: function(json)
    {
        return JSON.stringify(json, null, '  ')
            .replace(/\"([^(\")"\d\s\-]+)\":/g,"$1:");
    },

    /**
     * Convert shapes into readable JSON
     * @static
     * @method readableShapes
     * @param {Object} json
     */
    readableShapes: function(json)
    {
        return JSON.stringify(json).replace("{", "{\n  ")
            .replace("]}", "\n  ]\n}")
            .replace(/\:/g, ': ')
            .replace(/,/g, ', ')
            .replace(/(\"[a-z])/g, "\n    $1")
            .replace(/\],/g, "],\n  ");
    },

    /**
     * Optimize 8 bit colors to be shorthand hex values (e.g., "#ffcc99" => "#fc9")
     * @static
     * @method compressColors
     * @param {String} hex The hex color
     * @return {String}
     */
    compressColors: function(hex)
    {
        return hex.replace(/([a-f0-9])\1([a-f0-9])\2([a-f0-9])\3/, "$1$2$3");
    },

    /**
     * Convert a color transform array is a simple tint
     * @static
     * @private
     * @method simpleTint
     * @param {Array} array of 6 values, red, red-additive, green, green-additive, blue, blue-additive
     * @return {null|String} Color or null if not simple
     */
    simpleTint: function(arr)
    {
        // Check to see if we have a simple tint
        if (arr[1] === 0 && arr[3] === 0 && arr[5] === 0 && arr[0] >= 0 && arr[2] >= 0 && arr[4] >= 0)
        {
            const max = 255;
            const r = Math.round(arr[0] * max);
            const g = Math.round(arr[2] * max);
            const b = Math.round(arr[4] * max);
            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            return this.compressColors(hex);
        }
        return null;
    },

    /**
     * See if we can optimize all the keyframes with color transforms
     * @static
     * @method optimizeColorTransforms
     * @param {Object} frames
     */
    optimizeColorTransforms: function(frames)
    {
        const tints = {};
        const tintsTw = {};
        for (let i in frames)
        {
            let frame = frames[i];
            if (!frame.c)
            {
                return;
            }
            let tint = this.simpleTint(frames[i].c);
            if (tint === null)
            {
                return;
            }
            tints[i] = tint;
            if (frames[i].tween)
            {
                tint = this.simpleTint(frames[i].tween.color.end);
                if (tint === null) {
                    return;
                }
                tintsTw[i] = tint;
            }
        }

        for (let i in frames)
        {
            const frame = frames[i];
            delete frame.c;
            frame.t = tints[i];
            if (frame.tween && tintsTw[i])
            {
                frame.tween.replaceColorWithTint(tints[i], tintsTw[i]);
            }
        }
    }
};

module.exports = DataUtils;