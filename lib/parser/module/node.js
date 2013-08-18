var ast = require('../../mia').ast;


// Parse the exports of standard Node.js Modules ------------------------------
// ----------------------------------------------------------------------------
exports.parse = function(moduleName, tree) {

    var names = [];
    ast.traverse(tree, function(node) {
        return node.type === 'AssignmentExpression'
            && node.left.type === 'MemberExpression'
            && node.left.object.type === 'Identifier'
            && node.left.object.name === 'exports';

    }, function(node) {

        if (ast.isGlobalName(node, 'exports')) {
            names.push({
                name: moduleName + '.' + node.left.property.name,
                id: ast.getTarget(node.right, node.$scope).$uid
            });
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
            names.push({
                name: moduleName,
                id: ast.getTarget(node.right, node.$scope).$uid
            });
        }

    });

    return names;

};

