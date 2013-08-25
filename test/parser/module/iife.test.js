// Dependencies ---------------------------------------------------------------
var test = require('../../test'),
    validateExports = test.validateExports;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Module: Immediately invoked function expression (iife)', function() {

    var config = {
        module: 'iife'
    };

    it('should detect exports on the first object being passed in', function() {
        var source = '(function(exports) { var namespace = {}; function f() {}; exports.a = "a"; exports.b = "b"; exports.f = f; exports.n = namespace; exports.o = O(); function foo() { var exports; exports.c = "c"; } var l = function(exports) { exports.d = "d"; }})(this);';
        validateExports(
            source,
            config,
            ['Test.a', 'Test.b', 'Test.f', 'Test.n', 'Test.o'],
            [13, 19, 8, 3, 38]
        );
    });

    it('should detect indirect object property assignments', function() {
        var source = '(function(exports) { var b = { c: "Foo" }; b.a = { foo: "bla" }; b.b = "foo"; exports.b = b; })(this);';
        validateExports(
            source,
            config,
            ['Test.b'],
            [6]
        );
    });

});

