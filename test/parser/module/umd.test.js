// Dependencies ---------------------------------------------------------------
var test = require('../../test'),
    validateExports = test.validateExports;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Module: Universal Module Definition (UMD)', function() {

    var config = {
        module: 'umd'
    };

    it('should detect exports', function() {
        var source = "(function (root, factory) { 'use strict'; if (typeof define === 'function' && define.amd) { define(['exports'], factory); } else if (typeof exports !== 'undefined') { factory(exports); } else { factory((root.esprima = {})); } }(this, function (exports) { function A() {} exports.A = A; exports.B = function() {}; }));";
        validateExports(
            source,
            config,
            ['Test.A', 'Test.B'],
            [46, 57]
        );
    });

});

