var test = require('../test'),
    mia = test.mia,
    assert = test.assert;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Core: Comments', function() {

    var source = '/** Doc Block\n * Multiline\n * Comment\n */\nfunction Foo() {}\n/** Description */Foo.bar = 2;\n// Inline Comment\n/**Multiline\n\nDoc\n\nWith multiple newlines*/function Bar(){} var c;';
    var ast = mia.ast.parse(source).body;

    it('should correctly attach comments to their respective nodes', function() {
        assert.ok(ast[0].hasOwnProperty('$comment'));
        assert.ok(ast[1].hasOwnProperty('$comment'));
        assert.ok(ast[2].hasOwnProperty('$comment'));
        assert.ok(!ast[3].hasOwnProperty('$comment'));
    });

    it('should correctly cleanup comment text and split it into multiple lines', function() {
        assert.deepEqual(ast[0].$comment, 'Doc Block\nMultiline\nComment');
        assert.deepEqual(ast[1].$comment, 'Description');
        assert.deepEqual(ast[2].$comment, 'Multiline\n\nDoc\n\nWith multiple newlines');
    });

});

