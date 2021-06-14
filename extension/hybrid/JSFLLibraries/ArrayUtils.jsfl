(function () {

    /**
     *  Add utility methods to the Array class
     *  @class Array.prototype
     */

    /**
     *  See if an array contains a value
     *  @method contains
     *  @param {mixed} needle The value to check for
     */
    Array.prototype.contains = function (needle) {
        for (var k in this) {
            if (this[k] == needle) {
                return true;
            }
        }
        return false;
    };

}());