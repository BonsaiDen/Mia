// Dependencies ---------------------------------------------------------------
var test = require('../../test'),
    validateExports = test.validateExports;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Module: Node.js', function() {

    var config = {
        module: 'node'
    };

    it('should detect exports assignments', function() {
        var source = 'var A = function() {}; exports.A = A; exports.B = function() {}; exports.C = "foo";';
        validateExports(
            source,
            config,
            ['Test.A', 'Test.B', 'Test.C'],
            [3, 16, 22]
        );
    });

    it('should detect module.exports being assigned a function', function() {
        var source = 'module.exports = function() {}';
        validateExports(
            source,
            config,
            ['Test'],
            [5]
        );
    });


    it('should detect module.exports being assign a object expression', function() {
        var source = 'var A = 1, B = 2, C = 3; module.exports = { A: A, B: B, C: C }';
        validateExports(
            source,
            config,
            ['Test.A', 'Test.B', 'Test.C'],
            [2, 5, 8]
        );
    });

    it('should not crash on invalid exports', function() {
        var source = 'module.exports = A;';
        validateExports(source, config, [], []);

        source = 'exports.A = A;';
        validateExports(source, config, [], []);
    });

});

