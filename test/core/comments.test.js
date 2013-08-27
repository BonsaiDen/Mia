var test = require('../test'),
    mia = test.mia,
    assert = test.assert;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Core: Comments', function() {

    var full = '/**\n *Doc Block \n *    Multiline\n *    Comment   \n */\nfunction Foo() {}\n/** Description */Foo.bar = 2;\n// Inline Comment\n/**Multiline\n\nDoc\n\nWith multiple newlines*/function Bar(){} var c;';
    it('should correctly attach comments to their respective nodes', function() {
        var ast = mia.ast.parse(full).body;
        assert.ok(ast[0].hasOwnProperty('$comment'));
        assert.ok(ast[1].hasOwnProperty('$comment'));
        assert.ok(ast[2].hasOwnProperty('$comment'));
        assert.ok(!ast[3].hasOwnProperty('$comment'));
    });

    it('should clean up comments by removing leading and trailing newlines', function() {
        var ast = mia.ast.parse('/**\n* \n * \nDoc Block\n*Comment\n*Content\n* \n * \n*/function Foo() {}').body;
        assert.deepEqual(ast[0].$comment, 'Doc Block\nComment\nContent');
    });

    it('should clean up comments by removing leading * symbols and striping leading indentation', function() {
        var ast = mia.ast.parse('/**\n*  Doc Block\n*  Comment\n* \n*  Content*/function Foo() {}').body;
        assert.deepEqual(ast[0].$comment, 'Doc Block\nComment\n\nContent');
    });

    it('should correctly cleanup comment text and keep newlines and indentation', function() {
        var ast = mia.ast.parse(full).body;
        assert.deepEqual(ast[0].$comment, 'Doc Block\n    Multiline\n    Comment');
        assert.deepEqual(ast[1].$comment, 'Description');
        assert.deepEqual(ast[2].$comment, 'Multiline\n\nDoc\n\nWith multiple newlines');
    });

});

