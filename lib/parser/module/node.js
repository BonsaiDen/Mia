// Dependencies ---------------------------------------------------------------
var ast = require('../../mia').ast,
    util = require('./util');


// Parse the exports of standard Node.js Modules ------------------------------
// ----------------------------------------------------------------------------
exports.parse = function(moduleName, tree) {

    var exports = [];
    ast.traverse(tree, function(node) {
        return node.type === 'AssignmentExpression'
            && node.left.type === 'MemberExpression'
            && node.left.object.type === 'Identifier'
            && node.left.object.name === 'exports';

    }, function(node) {

        if (ast.isGlobalName(node, 'exports')) {
            var target = ast.getTarget(node.right, node.$scope);
            if (target) {
                exports.push({
                    name: moduleName + '.' + node.left.property.name,
                    id: target.$uid
                });
            }
        }

    });

    ast.traverse(tree, function(node) {
        return node.type === 'AssignmentExpression'
            && node.left.type === 'MemberExpression'
            && node.left.object.type === 'Identifier'
            && node.left.object.name === 'module'
            && node.left.property.name === 'exports';

    }, function(node) {
        if (ast.isGlobalName(node, 'module')) {

            var target = ast.getTarget(node.right, node.$scope);
            if (target) {

                if (ast.isFunction(target)) {
                    exports.push({
                        name: moduleName,
                        id: target.$uid
                    });

                } else if (target.type === 'ObjectExpression') {
                    exports.push.apply(exports, util.getObjectExports(moduleName, target));
                }

            }

        }
    });

    return exports;

};

