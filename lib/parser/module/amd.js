// Dependencies ---------------------------------------------------------------
var ast = require('../../mia').ast,
    util = require('./util');


// Parse the exports of AMD (Asynchronous Module Definition) modules ----------
// ----------------------------------------------------------------------------
exports.parse = function(moduleName, tree) {
    var top = tree[0];

    // We only look for one statement at the top level
    // TODO deal with multiple exports in the same file?
    if (!top || tree.length !== 1 || top.type !== 'ExpressionStatement') {
        return null;
    }

    top = top.expression;

    if (top.type === 'CallExpression'
        && top.callee.type === 'Identifier'
        && top.callee.name === 'define') {

        // Grab the last value as the target
        var args = top.arguments;

        // define(id?, dependencies?, factory);
        if (args.length === 0 || args.length > 3) {
            return null;

        // TODO if present, use the id instead of the supplied moduleName?
        } else {

            // There are a number of ways in which the factory can define the module
            var factory = top.arguments[top.arguments.length - 1];

            // Via a factory function
            if (ast.isFunction(factory)) {

                var returnValue = null;
                ast.traverse(factory.body, function(node) {

                    // Only use top level export
                    // TODO create ast.Helper for this with
                    if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
                        return null;
                    }

                    return node.type === 'ReturnStatement';

                }, function(node) {
                    returnValue = ast.getTarget(node.argument);
                });

                // Based on the return value
                if (returnValue) {

                    // Can be a function
                    if (ast.isFunction(returnValue)) {
                        return [{
                            name: moduleName,
                            id: returnValue.$uid
                        }];

                    // Or object Expression
                    } else if (returnValue.type === 'ObjectExpression') {
                        return util.getObjectExports(moduleName, returnValue);

                    } else {
                        return null;
                    }

                // Or via the exports argument to the factory (CommonJS style)
                } else if (factory.params.length >= 2) {
                    return util.getNameExports(moduleName, factory.params[1], factory.body.body);

                } else {
                    return null;
                }

            // Via a plain object definition
            // this does not allow for dependencies
            } else if (factory.type === 'ObjectExpression') {
                return util.getObjectExports(moduleName, factory);

            } else {
                return null;
            }

        }

    } else {
        return null;
    }

};

