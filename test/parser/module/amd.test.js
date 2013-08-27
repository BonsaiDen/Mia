// Dependencies ---------------------------------------------------------------
var test = require('../../test'),
    validateExports = test.validateExports;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Module: Asynchronous Module Definition (AMD)', function() {

    var config = {
        module: 'amd'
    };

    it('should detect factory only', function() {
        var source = 'define(function() { function Foo() {} return Foo;})';
        validateExports(
            source,
            config,
            ['Test'],
            [4]
        );
    });

    it('should detect id and factory', function() {
        var source = 'define("Bar", function() { function Foo() {} return Foo;})';
        validateExports(
            source,
            config,
            ['Test'],
            [5]
        );
    });

    it('should detect id, dependencies and factory', function() {
        var source = 'define("Bar", ["A", "B"], function() { function Foo() {} return Foo;})';
        validateExports(
            source,
            config,
            ['Test'],
            [8]
        );
    });

    it('should support returning objects', function() {
        var source = 'define(function() { function A() {} function B() {} function C() {} var mod = { A: A, B: B, C: C }; return mod; })';
        validateExports(
            source,
            config,
            ['Test.A', 'Test.B', 'Test.C'],
            [4, 7, 10]
        );
    });

    it('should support exports object', function() {
        var source = 'define(function(require, exports, module) { exports.A = function() {}; function B() {} exports.B = B; })';
        validateExports(
            source,
            config,
            ['Test.A', 'Test.B'],
            [9, 14]
        );
    });

    it('should not crash on invalid exports', function() {
        var source = 'define(function() { return A; })';
        validateExports(source, config, [], []);
        source = 'define(A)';
        validateExports(source, config, [], []);
        source = 'define(function(require, exports) { exports.A = A;})';
        validateExports(source, config, [], []);
    });

});

