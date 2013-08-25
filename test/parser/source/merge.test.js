// Dependencies ---------------------------------------------------------------
var test = require('../../test'),
    ast = test.mia.ast,
    Tag = test.mia.Tag,
    validateSource = test.validateSource;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Source: Merge Multiple Tags', function() {

    function A(name, node) {
        if (node.type === 'FunctionDeclaration' && name === 'foo') {
            return new Tag.Function(node.$uid, name, null, ['a']);

        } else if (node.type === 'FunctionDeclaration' && name === 'Foo') {
            var clas = new Tag.Class(node.$uid, name, null);
            clas.addParam('a');
            clas.addParam('b');
            clas.addMember(new Tag.Property(200, 'property', null));
            return clas;
        }
    }

    function B(name, node) {
        if (node.type === 'FunctionDeclaration' && name === 'foo') {
            return new Tag.Function(node.$uid, name, null, ['b']);

        } else if (node.type === 'FunctionDeclaration' && name === 'Foo') {
            var clas = new Tag.Class(node.$uid, name, null);
            clas.addParam('c');
            clas.addParam('d');
            clas.addMember(new Tag.Method(100, 'method', null, ['a', 'b'], []));
            return clas;
        }
    }

    // TODO test indirect handling
    function C(name, node) {
        if (node.type === 'FunctionDeclaration' && name === 'foo') {
            return new Tag.Function(node.$uid, name, null, ['b']);

        } else if (node.type === 'CallExpression') {
            var target = ast.getTarget(node.arguments[0]);
            if (target) {
                var clas = new test.mia.Tag.Class(target.$uid, ast.getName(target), null);
                clas.addParam('c');
                clas.addParam('d');
                clas.addMember(new test.mia.Tag.Method(100, 'method', null, ['a', 'b'], []));
                return clas;
            }
        }
    }

    it('should execute both parsers and merge results for the same UID', function() {

        var config = {
            source: [A, B]
        };

        var source = 'function foo(){} function Foo() {}';
        validateSource(source, config, 'foo', {
            type: 'Function',
            name: 'foo',
            comment: null,
            params: ['a', 'b']
        });

        validateSource(source, config, 'Foo', {
            type: 'Class',
            name: 'Foo',
            comment: null,
            params: ['a', 'b', 'c', 'd'],
            members: [{
                type: 'Property',
                name: 'property'
            }, {
                type: 'Method',
                name: 'method',
                params: ['a', 'b']
            }]
        });

    });

    it('should execute both parsers and merge results for the same UID from independent contexts', function() {

        var config = {
            source: [A, C]
        };

        // Normal Order
        var source = 'function Foo() {} inherit(Foo);';
        validateSource(source, config, 'Foo', {
            type: 'Class',
            name: 'Foo',
            comment: null,
            params: ['a', 'b', 'c', 'd'],
            members: [{
                type: 'Property',
                name: 'property'
            }, {
                type: 'Method',
                name: 'method',
                params: ['a', 'b']
            }]
        });


        // Reverse Order
        source = 'function foo(){} inherit(Foo); function Foo() {}';
        validateSource(source, config, 'Foo', {
            type: 'Class',
            name: 'Foo',
            comment: null,
            params: ['a', 'b', 'c', 'd'],
            members: [{
                type: 'Property',
                name: 'property'
            }, {
                type: 'Method',
                name: 'method',
                params: ['a', 'b']
            }]
        });

        // Should not record duplicates
        source = 'function foo(){} inherit(Foo); function Foo() {}; inherit(Foo)';
        validateSource(source, config, 'Foo', {
            type: 'Class',
            name: 'Foo',
            comment: null,
            params: ['a', 'b', 'c', 'd'],
            members: [{
                type: 'Property',
                name: 'property'
            }, {
                type: 'Method',
                name: 'method',
                params: ['a', 'b']
            }]
        });

    });

});

