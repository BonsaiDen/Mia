var ast = require('../../mia').ast;


// Parse the exports of AMD (Require.js) modules ------------------------------
// ----------------------------------------------------------------------------
exports.parse = function(moduleName, tree) {
    var top = tree[0];

    // We only look for one statement at the top level
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

        } else {

            var target = top.arguments[top.arguments.length - 1],
                isReturn = false;

            // Find the return value if a function is used for setup
            // we expect it on the top level, without any if / else for now
            if (target.type === 'FunctionExpression') {

                ast.traverse(target.body, function(node) {
                    if (node.type === 'ReturnStatement') {
                        return true;

                    } else if (ast.isFunction(node)) {
                        return null;
                    }

                }, function(node) {
                    target = node.argument;
                    isReturn = true;
                });

            }

            // Find the actual value of the exported value
            target = ast.getTarget(target);

            // If it's a function, it might have a name
            var name = (target.id && !isReturn ? target.id.name : null);
            return [{
                name: moduleName + (name ? '.' + name : ''),
                id: target.$uid
            }];

        }

    } else {
        return null;
    }

};

