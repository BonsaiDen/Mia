var assert = require('assert'),
    mia = require('../lib/mia');


// Helpers --------------------------------------------------------------------
function validateAnnotation(source, config, expected) {
    var module = mia.parseModule('Test', source, config),
        tag = module.internal.foo;

    assert.deepEqual(expected, tag.comment);
}

function validateExports(source, config, enames, eids) {

    var names = [],
        ids = [];

    var module = mia.parseModule('Test', source, config);
    for(var name in module.exports) {
        if (module.exports.hasOwnProperty(name)) {
            names.push(name);
            ids.push(module.exports[name].id);
        }
    }

    assert.deepEqual(names, enames);
    assert.deepEqual(ids, eids);

}

function validateSource(source, config, name, expected) {

    var module = mia.parseModule('Test', source, config);
    assert.ok(module.internal.hasOwnProperty(name), 'Name "' + name + '" not found');

    var compares = 0;
    function compare(object, expected) {
        if (typeof object !== 'object' || object === null) {
            assert.strictEqual(object, expected);
            compares++;

        } else {

            for(var key in expected) {
                if (expected.hasOwnProperty(key)) {
                    var value = expected[key];
                    if (value instanceof Array) {

                        assert.ok(object[key] instanceof Array, 'Expected array for key:' + key);
                        assert.strictEqual(object[key].length, value.length);

                        value.forEach(function(item, i) {
                            compare(object[key][i], item);
                        });

                        compares++;

                    } else if (typeof value === 'object' && value !== null) {
                        compare(object[key], value);

                    } else {
                        assert.strictEqual(object[key], value);
                        compares++;
                    }
                }
            }

        }

    }

    compare(module.internal[name], expected);
    assert.ok(compares > 0, 'No comparisons');

}


// Exports --------------------------------------------------------------------
// ----------------------------------------------------------------------------
exports.mia = mia;
exports.assert = assert;
exports.validateAnnotation = validateAnnotation;
exports.validateExports = validateExports;
exports.validateSource = validateSource;

