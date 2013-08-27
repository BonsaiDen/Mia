var test = require('../test'),
    mia = test.mia,
    assert = test.assert;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Core: AST', function() {

    var source = '/** Doc Block\n * Multiline\n * Comment\n */\nfunction Foo() {}\n/** Description */Foo.bar = 2;\n// Inline Comment\nfunction Bar(){}';
    var ast = mia.ast.parse(source);

    it('should add $parent references', function() {
        assert.notStrictEqual(ast.$parent, null);
        assert.strictEqual(typeof ast.$parent, 'object');
        assert.strictEqual(ast.body[0].$parent, ast);
        assert.strictEqual(ast.body[1].$parent, ast);
    });

    it('should add scopes to all function nodes and the root', function() {
        assert.strictEqual(typeof ast.$$scope, 'object');
        assert.strictEqual(typeof ast.body[0].$$scope, 'object');
        assert.strictEqual(typeof ast.body[1].$$scope, 'undefined');
        assert.strictEqual(typeof ast.body[2].$$scope, 'object');
    });

    it('should add scope references to all nodes', function() {
        assert.strictEqual(ast.$scope, ast.$$scope);
        assert.strictEqual(ast.body[0].$scope, ast.$$scope);
        assert.strictEqual(ast.body[1].$scope, ast.$$scope);
        assert.strictEqual(ast.body[2].$scope, ast.$$scope);
    });

    it('should add the $scopeList property to the root node', function() {
        assert.ok(ast.$scopeList instanceof Array);
    });

    it('should add $uid values to all nodes', function() {
        assert.strictEqual(typeof ast.$uid, 'number');
        assert.strictEqual(typeof ast.body[0].$uid, 'number');
        assert.strictEqual(typeof ast.body[1].$uid, 'number');
    });

    it('should clean up the AST nodes and remove superflous Esprima properties', function() {
        assert.strictEqual(ast.comments, null);
        assert.strictEqual(ast.leadingComments, null);
        assert.strictEqual(ast.trailingComments, null);
        assert.strictEqual(ast.extendedRange, null);
        assert.strictEqual(ast.range, null);
        assert.strictEqual(ast.tokens, null);
    });

});
