var test = require('../../test'),
    validateSource = test.validateSource;


// Tests ----------------------------------------------------------------------
// ----------------------------------------------------------------------------
describe('Source: Prototypical', function() {

    var config = {
        source: 'prototypical'
    };

    it('should detect function declarations', function() {
        var source = 'function foo(a, b) { return a + b; }';
        validateSource(source, config, 'foo', {
            type: 'Function',
            name: 'foo',
            comment: null,
            params: ['a', 'b']
        });
    });

    it('should detect function expressions', function() {
        var source = 'var foo = function(a, b) { return a + b; }';
        validateSource(source, config, 'foo', {
            type: 'Function',
            name: 'foo',
            comment: null,
            params: ['a', 'b']
        });
    });

    it('should detect factory functions (return a new value)', function() {

        // Direct return
        var source = 'function fooFactory(a, b) { return new Foo(a, b); }';
        validateSource(source, config, 'fooFactory', {
            type: 'Factory',
            name: 'fooFactory',
            comment: null,
            params: ['a', 'b']
        });

        // Indirect return
        source = 'function fooFactory(a, b) { var inst = new Foo(a, b); return inst; }';
        validateSource(source, config, 'fooFactory', {
            type: 'Factory',
            name: 'fooFactory',
            comment: null,
            params: ['a', 'b']
        });

    });

    it('should detect constructors', function() {

        // Via capitilization
        var source = 'function Foo(a, b) {  }';
        validateSource(source, config, 'Foo', {
            type: 'Class'
        });

        // Via member assignment
        source = 'function foo(a, b) { this.a = a; this.b = b; }';
        validateSource(source, config, 'foo', {
            type: 'Class'
        });

        // Via super call
        source = 'function foo(a, b) { Bar.call(this); }';
        validateSource(source, config, 'foo', {
            type: 'Class'
        });

    });

    it('should detect property members', function() {
        var source = 'function Foo(a, b) { this.a = a; this.b = b; } Foo.prototype.c = 2; Foo.prototype = { d: 2 }';
        validateSource(source, config, 'Foo', {
            members: [{
                type: 'Property',
                name: 'a'
            }, {
                type: 'Property',
                name: 'b'
            }, {
                type: 'Property',
                name: 'c'
            }, {
                type: 'Property',
                name: 'd'
            }]
        });
    });

    it('should detect prototype methods', function() {

        var source = 'function Foo() {} Foo.prototype.a = function() {}; Foo.prototype = { b: function() {} }; var c = function() {}; Foo.prototype.c = c;';
        validateSource(source, config, 'Foo', {
            members: [{
                type: 'Method',
                name: 'a'
            }, {
                type: 'Method',
                name: 'b'
            }, {
                type: 'Method',
                name: 'c'
            }]
        });

    });

    it('should detect static properties', function() {
        var source = 'function Foo() {} Foo.a = 0; Foo.b = 1;';
        validateSource(source, config, 'Foo', {
            statics: [{
                type: 'Property',
                name: 'a'
            }, {
                type: 'Property',
                name: 'b'
            }]
        });
    });

    it('should detect static functions', function() {
        var source = 'function Foo() {} Foo.a = function() {}; Foo.b = function() {}; function c() {}; Foo.c = c;';
        validateSource(source, config, 'Foo', {
            statics: [{
                type: 'Function',
                name: 'a'
            }, {
                type: 'Function',
                name: 'b'
            }, {
                type: 'Function',
                name: 'c'
            }]
        });
    });

    it('should detect inheritance', function() {

        // via super call
        var source = 'function Bar() {} function Foo() { Bar.call(this); }';
        validateSource(source, config, 'Foo', {
            bases: [3]
        });

        // via super apply
        source = 'function Bar() {} function Foo() { Bar.apply(this, []); }';
        validateSource(source, config, 'Foo', {
            bases: [3]
        });

        // Via prototype create object
        source = 'function Bar() {} function Foo() {} Foo.prototype = Object.create(Bar.prototype);';
        validateSource(source, config, 'Foo', {
            bases: [3]
        });

        // via prototype new
        source = 'function Bar() {} function Foo() {} Foo.prototype = new Bar();';
        validateSource(source, config, 'Foo', {
            bases: [3]
        });

    });

    it('should detect super method calls', function() {

        // via super call
        var source = 'function Bar() {} Bar.prototype.method = function() {}; function Foo() { Bar.call(this); } Foo.prototype.method = function() { Bar.prototype.method.call(this); };';
        validateSource(source, config, 'Foo', {
            bases: [3],
            members: [{
                type: 'Method',
                supers: [3]
            }]
        });

        // via super apply
        source = 'function Bar() {} Bar.prototype.method = function() {}; function Foo() { Bar.call(this); } Foo.prototype.method = function() { Bar.prototype.method.call(this); };';
        validateSource(source, config, 'Foo', {
            bases: [3],
            members: [{
                type: 'Method',
                supers: [3]
            }]
        });

    });

});
