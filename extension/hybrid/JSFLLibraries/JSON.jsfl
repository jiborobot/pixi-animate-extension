(function (global) {

    /**
     *  The JSON serialization and unserialization methods
     *  @class JSON
     */
    var JSON = {};

    JSON.prettyPrint = false;

    /**
     *  implement JSON.stringify serialization
     *  @method stringify
     *  @param {Object} obj The object to convert
     */
    JSON.stringify = function (obj) {
        return _internalStringify(obj, 0);
    };

    function _internalStringify(obj, depth, fromArray) {
        var t = typeof (obj);
        if (t != "object" || obj === null) {
            // simple data type
            if (t == "string") return '"' + obj + '"';
            return String(obj);
        } else {
            // recurse array or object
            var n, v, json = [],
                arr = (obj && obj.constructor == Array);

            var joinString, bracketString, firstPropString;
            if (JSON.prettyPrint) {
                joinString = ",\n";
                bracketString = "\n";
                for (var i = 0; i < depth; ++i) {
                    joinString += "\t";
                    bracketString += "\t";
                }
                joinString += "\t"; //one extra for the properties of this object
                firstPropString = bracketString + "\t";
            } else {
                joinString = ",";
                firstPropString = bracketString = "";
            }
            for (n in obj) {
                v = obj[n];
                t = typeof (v);

                // Ignore functions
                if (t == "function") continue;

                if (t == "string") v = '"' + v + '"';
                else if (t == "object" && v !== null) v = _internalStringify(v, depth + 1, arr);

                json.push((arr ? "" : '"' + n + '":') + String(v));
            }
            return (fromArray || depth === 0 ? "" : bracketString) + (arr ? "[" : "{") + firstPropString + json.join(joinString) + bracketString + (arr ? "]" : "}");
        }
    }

    /**
     *  Implement JSON.parse de-serialization
     *  @method parse
     *  @param {String} str The string to de-serialize
     */
    JSON.parse = function (str) {
        if (str === "") str = '""';
        eval("var p=" + str + ";"); // jshint ignore:line
        return p;
    };

    // Assign to global space
    global.JSON = JSON;

}(window));