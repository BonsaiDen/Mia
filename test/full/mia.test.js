// Dependencies ---------------------------------------------------------------
var test = require('../test'),
    fs = require('fs'),
    mia = test.mia,
    assert = test.assert;


// Parse a prototypical IIFE module with Mia annotations ----------------------
// ----------------------------------------------------------------------------
describe('Full: Parse a Prototypical IIFE module with Mia annotations', function() {

    it('should parse the module', function() {

        var source = fs.readFileSync('test/full/mia/source.js').toString(),
            expected = JSON.parse(fs.readFileSync('test/full/mia/expected.js').toString());

        var module = mia.parse('Module', source, {
            module: 'iife',
            source: 'prototypical',
            annotation: 'mia'
        });

        assert.deepEqual(expected, module);

    });

});

