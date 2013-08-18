var test = require('../../test'),
    validateAnnotation = test.validateAnnotation;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Annotation: Mia', function() {

    var config = {
        sources: ['prototypical'],
        annotations: ['mia']
    };

    it('should parse a type', function() {
        var source = '/** {String} */\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: null,
            params: [{
                type: 'String',
                description: null,
                defaultValue: null
            }],
            returns: null
        });
    });

    it('should parse a type with description', function() {
        var source = '/** {String}: A String */\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: null,
            params: [{
                type: 'String',
                description: 'A String',
                defaultValue: null
            }],
            returns: null
        });
    });

    it('should handle the colon after the type as optional', function() {
        var source = '/** {String} A String */\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: null,
            params: [{
                type: 'String',
                description: 'A String',
                defaultValue: null
            }],
            returns: null
        });

        source = '/** {String} ("Foo") A String */\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: null,
            params: [{
                type: 'String',
                description: 'A String',
                defaultValue: '"Foo"'
            }],
            returns: null
        });

    });

    it('should parse a type with default value', function() {
        var source = '/** {String} ("Hello World") */\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: null,
            params: [{
                type: 'String',
                description: null,
                defaultValue: '"Hello World"'
            }],
            returns: null
        });
    });

    it('should parse a type with default value and description', function() {
        var source = '/** {String} ("Hello World"): A String */\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: null,
            params: [{
                type: 'String',
                description: 'A String',
                defaultValue: '"Hello World"'
            }],
            returns: null
        });
    });

    it('should parse return types', function() {
        var source = '/** -> {String} ("Hello World"): A String */\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: null,
            params: [],
            returns: {
                type: 'String',
                description: 'A String',
                defaultValue: '"Hello World"'
            }
        });

    });

    it('should parse multiple types', function() {
        var source = '/** {String}; {Integer}: Count; {Float} (2.3): Value -> {Object} Returns an object*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: null,
            params: [{
                type: 'String',
                description: null,
                defaultValue: null
            }, {
                type: 'Integer',
                description: 'Count',
                defaultValue: null
            }, {
                type: 'Float',
                description: 'Value',
                defaultValue: '2.3'
            }],
            returns: {
                type: 'Object',
                description: 'Returns an object',
                defaultValue: null
            }
        });

    });

    it('should parse general descriptions', function() {
        var source = '/** Is a function */\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: 'Is a function',
            params: [],
            returns: null
        });
    });

    it('should parse sole return descriptions', function() {
        var source = '/** -> Returns a value*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: null,
            params: [],
            returns: {
                type: null,
                description: 'Returns a value',
                defaultValue: null
            }
        });
    });

    it('should parse everything together', function() {
        var source = '/** A generic function; {Integer} (1.0): Value  ; {Integer}: Other -> {Float} Returns a value*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: 'A generic function',
            params: [{
                type: 'Integer',
                description: 'Value',
                defaultValue: '1.0'
            }, {
                type: 'Integer',
                description: 'Other',
                defaultValue: null
            }],
            returns: {
                type: 'Float',
                description: 'Returns a value',
                defaultValue: null
            }
        });
    });

    it('should handle multiline comments', function() {
        var source = '/** A generic \nfunction; {Integer} \n(1.0): Value  \n; {Integer}: Other -> {Float} Returns a \nvalue*/\nfunction foo() {}';
        validateAnnotation(source, config, {
            description: 'A generic function',
            params: [{
                type: 'Integer',
                description: 'Value',
                defaultValue: '1.0'
            }, {
                type: 'Integer',
                description: 'Other',
                defaultValue: null
            }],
            returns: {
                type: 'Float',
                description: 'Returns a value',
                defaultValue: null
            }
        });
    });

});

