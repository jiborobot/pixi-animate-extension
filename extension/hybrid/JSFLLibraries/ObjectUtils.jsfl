(function () {

    /**
     *  Add utility methods to the Object class
     *  @class Object.prototype
     */

    /**
     *  See if an array contains a value
     *  @method contains
     *  @param {mixed} needle The value to check for
     */
    Object.prototype.contains = function (needle) {
        for (var k in this) {
            if (this[k] == needle) {
                return true;
            }
        }
        return false;
    };

}());