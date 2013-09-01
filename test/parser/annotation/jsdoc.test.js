// Dependencies ---------------------------------------------------------------
var test = require('../../test'),
    validateAnnotation = test.validateAnnotation;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Annotation: jsdoc', function() {

    var config = {
        source: 'prototypical',
        annotation: 'jsdoc'
    };

    it('should ignore missing doc blocks', function() {
        var source = 'function foo() {}';
        validateAnnotation(source, config, null);
    });

    it('should parse simple type', function() {

        // Test simple type
        var source = '/** @param {String} param */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String'
            }]
        });

        // Test identifiers in types
        source = '/** @param {a0901barFoo_1234$} param */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'a0901barFoo_1234$'
            }]
        });

    });

    // TODO add nullable info to annotation
    it('should parse nullable and non-nullable types', function() {
        var source = '/** @param {?String} param */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String'
            }]
        });

        source = '/** @param {!String} param */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String'
            }]
        });
    });

    it('should parse multiple types', function() {
        var source = '/** @param {(String|Integer|Null)} params */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: ['String', 'Integer', 'Null']
            }]
        });
    });

    it('should parse array types', function() {
        var source = '/** @param {String[]} param */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: {
                    name: 'String',
                    array: true
                }
            }]
        });
    });

    it('should parse optional parameters', function() {

        var source = '/** @param {String=} param */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                optional: true
            }]
        });

        source = '/** @param {(String|Integer=)} param */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: ['String', 'Integer'],
                optional: true
            }]
        });

    });

    it('should parse parameters with a default value as optional', function() {

        // With quotes
        var source = '/** @param {String=} [param="Hello World"] */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                defaultValue: '"Hello World"',
                optional: true
            }]
        });

        // Without quotes
        source = '/** @param {String=} [param=Hello World] */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                defaultValue: 'Hello World',
                optional: true
            }]
        });

    });

    it('should parse parameter types and description', function() {
        var source = '/** @param {String} [param="Hello World"] A String parameter\n@param {Integer} [param=4] A Integer parameter*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                defaultValue: '"Hello World"',
                description: 'A String parameter.',
                optional: true
            },{
                type: 'Integer',
                defaultValue: '4',
                description: 'A Integer parameter.',
                optional: true
            }]
        });

    });

    it('should parse a type with description and end all descriptions with a dot', function() {
        var source = '/** @param {String} param A String*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                description: 'A String.'
            }]
        });

        source = '/** @param {String} param A String.*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                description: 'A String.'
            }]
        });
    });

    it('should parse a optional parameter with default value', function() {
        var source = '/** @param {String} [param="Hello World"] A String.*/function foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                description: 'A String.',
                defaultValue: '"Hello World"',
                optional: true
            }]
        });

    });

    it('should parse return types', function() {
        var source = '/** @returns {String} A String */function foo() {}';
        validateAnnotation(source, config, {
            returns: {
                type: 'String',
                description: 'A String.'
            }
        });
    });

    it('should parse general descriptions without types', function() {
        var source = '/** Is a function*/ function foo() {}';
        validateAnnotation(source, config, {
            description: 'Is a function.'
        });
    });


    it('should parse return descriptions without type', function() {
        var source = '/** @returns Returns a value. */function foo() {}';
        validateAnnotation(source, config, {
            returns: {
                description: 'Returns a value.'
            }
        });
    });

    it('should parse visibility hints', function() {

        var source = '/** A private method\n @private \n @returns {Integer}*/function foo() {}';
        validateAnnotation(source, config, {
            description: 'A private method.',
            returns: {
                type: 'Integer'
            },
            visibility: 'private'
        });

        source = '/** A protected method\n @protected \n @returns {Integer} */function foo() {}';
        validateAnnotation(source, config, {
            description: 'A protected method.',
            returns: {
                type: 'Integer'
            },
            visibility: 'protected'
        });

        source = '/** A public method\n @public \n @returns {Integer} */function foo() {}';
        validateAnnotation(source, config, {
            description: 'A public method.',
            returns: {
                type: 'Integer'
            },
            visibility: 'public'
        });

    });

    it('should parse property annotations with type, defaultValue and description', function() {

        var source = '/** A function */ function Foo() { /** @type {Integer} A Property */ this.foo = 1; }',
            module = test.mia.parse('Test', source, config),
            tag = module.internal.Foo;

        test.assert.deepEqual({
            description: 'A function.'

        }, tag.comment);

        test.assert.deepEqual({
            type: 'Integer',
            description: 'A Property.'

        }, tag.members[0].comment);

    });

});

