// Dependencies ---------------------------------------------------------------
var util = require('./util');


// Parse the exports of Immediately Invoked Function Expression ---------------
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

    // Top most statement should be a call expression of a function
    if (top.type === 'CallExpression'
        && top.callee.type === 'FunctionExpression') {


        // Call must take at least one argument
        if (top.arguments.length === 1) {

            var func = top.callee;
            var params = func.params.filter(function(p) {
                return p.name !== 'undefined';
            });

            // Take the first parameter that is not "undefined"
            if (params.length !== 0) {
                return util.getNameExports(moduleName, params[0], func.body.body);

            } else {
                return null;
            }

        } else {
            return null;
        }


    } else {
        return null;
    }

};

