// Dependencies ---------------------------------------------------------------
var test = require('../../test'),
    validateAnnotation = test.validateAnnotation;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Annotation: Mia', function() {

    var config = {
        source: 'prototypical',
        annotation: 'mia'
    };

    it('should ignore missing doc blocks', function() {
        var source = 'function foo() {}';
        validateAnnotation(source, config, null);
    });

    it('should parse simple type', function() {

        // Test simple type
        var source = '/** {String} */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String'
            }]
        });

        // Test identifiers in types
        source = '/** {a0901barFoo_1234$} */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'a0901barFoo_1234$'
            }]
        });

    });

    it('should parse multiple types', function() {
        var source = '/** {String|Integer|Null} */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: ['String', 'Integer', 'Null']
            }]
        });
    });

    it('should parse array types', function() {
        var source = '/** {String[]} */\nfunction foo() {}';
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

        var source = '/** {String?} */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                optional: true
            }]
        });

        source = '/** {String|Integer?} */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: ['String', 'Integer'],
                optional: true
            }]
        });

    });

    it('should parse parameters with a default value as optional', function() {
        var source = '/** {String} ("Hello World") */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                defaultValue: '"Hello World"',
                optional: true
            }]
        });
    });


    it('should parse a type with description and end all descriptions with a dot', function() {
        var source = '/** {String}: A String */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                description: 'A String.'
            }]
        });

        source = '/** {String}: A String. */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                description: 'A String.'
            }]
        });
    });

    it('should handle the colon after the parameter/type as optional', function() {
        var source = '/** {String} A String */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                description: 'A String.'
            }]
        });

        source = '/** {String} ("Foo") A String */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                description: 'A String.',
                defaultValue: '"Foo"',
                optional: true
            }]
        });

    });

    it('should parse multiple types with complex default values', function() {
        var source = '/** {String} ("Hello World"); {Integer} (1.0); {Vector} (Vector(2.0, 2.0))*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                defaultValue: '"Hello World"',
                optional: true
            }, {
                type: 'Integer',
                defaultValue: '1.0',
                optional: true
            }, {
                type: 'Vector',
                defaultValue: 'Vector(2.0, 2.0)',
                optional: true
            }]
        });
    });


    it('should parse a type with default value and description', function() {
        var source = '/** {String} ("Hello World"): A String */\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String',
                description: 'A String.',
                defaultValue: '"Hello World"',
                optional: true
            }]
        });
    });

    it('should parse return types and ignore default values', function() {
        var source = '/** -> {String} ("Hello World"): A String */\nfunction foo() {}';
        validateAnnotation(source, config, {
            returns: {
                type: 'String',
                description: 'A String.'
            }
        });
    });

    it('should parse multiple paramters', function() {
        var source = '/** {String}; {Integer}: Count; {Float} (2.3): Value -> {Object} Returns an object*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            params: [{
                type: 'String'
            }, {
                type: 'Integer',
                description: 'Count.',
            }, {
                type: 'Float',
                description: 'Value.',
                defaultValue: '2.3',
                optional: true
            }],
            returns: {
                type: 'Object',
                description: 'Returns an object.'
            }
        });

    });

    it('should parse general descriptions without types', function() {
        var source = '/** Is a function */\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: 'Is a function.'
        });
    });

    it('should parse return descriptions without types', function() {
        var source = '/** -> Returns a value*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            returns: {
                description: 'Returns a value.'
            }
        });
    });

    it('should parse property annotations with type, defaultValue and description', function() {

        var source = '/** A function */ function Foo() { /** {Integer} (0.0): A Property */ this.foo = 1; }',
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

    it('should parse everything together', function() {
        var source = '/** A generic function; {Integer} (1.0): Value  ; {Integer}: Other -> {Float} Returns a value*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: 'A generic function.',
            params: [{
                type: 'Integer',
                description: 'Value.',
                optional: true,
                defaultValue: '1.0'
            }, {
                type: 'Integer',
                description: 'Other.'
            }],
            returns: {
                type: 'Float',
                description: 'Returns a value.'
            }
        });
    });

    it('should handle multiline comments', function() {
        var source = '/** A generic \nfunction; {Integer} \n(1.0): Value  \n; {Integer}: Other -> {Float} Returns a \nvalue*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: 'A generic function.',
            params: [{
                type: 'Integer',
                description: 'Value.',
                defaultValue: '1.0',
                optional: true
            }, {
                type: 'Integer',
                description: 'Other.'
            }],
            returns: {
                type: 'Float',
                description: 'Returns a value.'
            }
        });
    });

    it('should handle {Type} tokens as separators', function() {
        var source = '/** The Description\n\n {String} First parameter {Float} Second parameter -> {Integer}*/function foo() {}';
        validateAnnotation(source, config, {
            description: 'The Description.',
            params: [{
                type: 'String',
                description: 'First parameter.'
            }, {
                type: 'Float',
                description: 'Second parameter.'
            }],
            returns: {
                type: 'Integer'
            }
        });

    });

    it('should parse visibility hints', function() {

        var source = '/** @private A private method -> {Integer} */function foo() {}';
        validateAnnotation(source, config, {
            description: 'A private method.',
            returns: {
                type: 'Integer'
            },
            visibility: 'private'
        });

        source = '/** @protected A protected method -> {Integer} */function foo() {}';
        validateAnnotation(source, config, {
            description: 'A protected method.',
            returns: {
                type: 'Integer'
            },
            visibility: 'protected'
        });

        source = '/** @public A public method -> {Integer} */function foo() {}';
        validateAnnotation(source, config, {
            description: 'A public method.',
            returns: {
                type: 'Integer'
            },
            visibility: 'public'
        });

    });

    it('should correctly deal with multiple newline characters including leading ones', function() {
        var source = '/** \n@private \nA \n\n\nprivate \n\nmethod -> \n{Integer} */function foo() {}';
        validateAnnotation(source, config, {
            description: 'A private method.',
            returns: {
                type: 'Integer'
            },
            visibility: 'private'
        });
    });

    it('should correctly deal with indented comments', function() {
        var source = '/** \n     @private \nA \n\n\n       private \n\n      method -> \n          {Integer} */function foo() {}';
        validateAnnotation(source, config, {
            description: 'A private method.',
            returns: {
                type: 'Integer'
            },
            visibility: 'private'
        });
    });

});

