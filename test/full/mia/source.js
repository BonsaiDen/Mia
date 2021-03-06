/**
  * Top level module documentation.
  */
(function(exports) {

    /** A Internal Base Class; {String} The name of the internal */
    var Internal = function() {
        /** {Integer}: The unique ID of the class instance */
        this.id = ++Internal.id;

    };

    /** {Integer}: Unique ID counter for instance ids */
    Internal.uid = 0;

    /** {Integer}: Value A; {Integer}: Value B -> {Integer}: The result */
    Internal.prototype.add = function(a, b) {
        return a + b;
    };

    /** @private A private method -> {Integer} */
    Internal.prototype.hidden = function() {
        return 4;
    };

    /** The External Class; {String} The name of the external */
    function External(name) {

        /** {String}: Name */
        this.name = name;

        Internal.call(this);

    }

    /** {Any}: Any value -> {Any}: Returns the passed in value */
    External.classMethod = function(a) {
        return a;
    };

    External.prototype = Object.create(Internal.prototype);

    /** {Integer}: Value A; {Integer}: Value B -> {Integer}: The result */
    External.prototype.add = function(a, b) {
        return Internal.prototype.add.call(this, a, b);
    };

    // Prototype Aliasing
    var proto = External.prototype;

    /** A Static Factory -> {External} */
    External.CreateExternal = function() {
        return new External();
    };

    /** Aliased method with multiple names -> {Null} */
    proto.method = proto.methodAlias = function() {
        return null;
    };

    // Public interface
    exports.External = External;

})(typeof module === 'undefined' ? (window.Module = {}) : module.exports);

