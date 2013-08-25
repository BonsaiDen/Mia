// Dependencies ---------------------------------------------------------------
var test = require('../../test'),
    validateSource = test.validateSource;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Source: Custom Function', function() {

    var nodeCounter = 0;
    function custom(name, node) {
        nodeCounter++;
        if (node.type === 'FunctionDeclaration' && name === 'foo') {
            return new test.mia.Tag.Function(node.$uid, name, null, []);
        }
    }

    var config = {
        source: custom
    };

    it('should execute custom parser functions and run over all call and assignment expressions, even in sequence expressions', function() {

        var source = 'function foo(){} callMethod(); "Hello World"; e = 2 + 2; [1, 2]; "Foo", e = 1 + 1;';
        validateSource(source, config, 'foo', {
            type: 'Function',
            name: 'foo',
            comment: null,
            params: []
        });

        test.assert.strictEqual(nodeCounter, 4);

    });

});

