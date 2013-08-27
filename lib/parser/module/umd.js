// Dependencies ---------------------------------------------------------------
var util = require('./util');


// Parse the exports of UMD (Universal Module Definition) modules -------------
// ----------------------------------------------------------------------------
exports.parse = function(moduleName, tree) {

    var top = tree[0];

    // We only look for one statement at the top level
    if (!top || tree.length !== 1 || top.type !== 'ExpressionStatement') {
        return null;
    }

    top = top.expression;

    // There's also the unary prefix pattern instead of wrapping the function
    // in paranthesis
    if (top.type === 'UnaryExpression') {
        top = top.argument;
    }

    // UMD Wrapper
    if (top.type === 'CallExpression'
        && top.callee.type === 'FunctionExpression'
        && top.callee.params.length === 2) {

        // Callee
        var args = top.arguments;
        if (args.length === 2
            && args[0].type === 'ThisExpression'
            && args[1].type === 'FunctionExpression'
            && args[1].params.length >= 1) {

            return util.getNameExports(moduleName, args[1].params[0], args[1].body.body);

        } else {
            return null;
        }

    } else {
        return null;
    }

};

