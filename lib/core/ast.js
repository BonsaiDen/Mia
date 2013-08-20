// Custom Error Class ---------------------------------------------------------
function MiaAstError(method, message) {
    this.name = "MiaAstError";
    this.message = method + ': ' + (message || '');
}

MiaAstError.prototype = Error.prototype;
MiaAstError.prototype.constructor = Error;


// Mia AST Handling -----------------------------------------------------------
// ----------------------------------------------------------------------------
var ast = {

    // Public -----------------------------------------------------------------
    parse: function(source) {
        return require('./core').astFromSource(ast, source);
    },


    // Generic ----------------------------------------------------------------
    isFunction: function(node) {
        return node && (node.type === 'FunctionExpression'
            || node.type === 'FunctionDeclaration');
    },

    isGlobalName: function(scopeNode, name) {
        return scopeNode && scopeNode.$scope.resolveName(name) === null;
    },

    traverse: function(node, validator, callback, parent, results) {
        results = results || [];
        validator = typeof validator === 'function' ? validator : null;
        ast.traverseSub(node, validator, callback, parent || { type: 'File' }, results);
        return results;
    },

    traverseSub: function(node, validator, callback, parent, results) {

        if (node === null || typeof node !== 'object') {
            return;

        } else if (node instanceof Array) {
            for(var i = 0, l = node.length; i < l; i++) {
                ast.traverseSub(node[i], validator, callback, parent, results);
            }

        } else {

            // Run node validator if it exists
            var valid = validator ? validator(node, parent) : true;

            // Skip sub tree and node if requested
            if (valid !== null) {

                for(var key in node) {

                    // Skip parent references or mia properties (prefixed with $)
                    if (key[0] !== '$' && key !== 'range') {
                        ast.traverseSub(node[key], validator, callback, node, results);
                    }

                }

                // Invoke callback bottom up
                if (valid) {
                    var result = callback(node, parent);
                    if (result) {
                        results.push(result);
                    }
                }

            }

        }

    },


    // Nodes ------------------------------------------------------------------
    getName: function(expr, post) {

        if (!expr) {
            throw new MiaAstError('getName', 'Invalid Node');

        } else if (expr.type === 'Identifier') {
            return expr.name;
        }

        var name;
        if (expr.object.type === 'Identifier') {
            name = expr.object.name;

        } else if (expr.object.type === 'ThisExpression') {
            name = 'this';

        } else {
            name = ast.getName(expr.object, name);
        }

        var property = expr.computed ? '[]' : expr.property.name;
        if (name) {
            if (post) {
                return name + '.' + property + '.' + post;

            } else {
                return name + '.' + property;
            }

        } else {
            return property + '.' + post;
        }

    },

    getTarget: function(node, scope, ignoreMembers) {

        if (!node) {
            throw new MiaAstError('getTarget', 'Invalid Node');
        }

        // Fall back to the node scope
        scope = scope || node.$scope;
        if (!scope) {
            throw new MiaAstError('getTarget', 'Invalid Scope');
        }

        // Now follow the node's name until we find the eventual target
        // of its reference
        while(node) {

            // Look up identifiers
            if (node.type === 'Identifier') {
                node = scope.resolveName(node.name);

            // Look up member expressions
            } else if (node.type === 'MemberExpression' && !ignoreMembers) {
                node = scope.resolveName(ast.getName(node));

            } else {
                break;
            }

            // We might come back with a variable declarator
            // first we try and use the init value
            if (node && node.type === 'VariableDeclarator') {
                node = node.init;
            }

        }

        return node;

    },


    // Assignments ------------------------------------------------------------
    getAssignments: function(node, name, nameOrigin) {

        name = name || ast.getName(node);

        return ast.traverse(node, function(node) {
            if (node.type === 'AssignmentExpression') {

                if (node.left.type === 'MemberExpression') {
                    return true;

                } else if (node.left.type === 'Identifier') {
                    return true;
                }

            } else {
                return false;
            }

        }, function(node) {

            // Get the original node that declares the name
            // if it's the same as the one we're looking for
            // return the assignment node
            var name = ast.getName(node.left);
            var originNode = node.$scope.resolveName(name.substring(0, name.indexOf('.')));
            if (nameOrigin === originNode) {
                return node;
            }

        });

    },

    getAssignmentToNode: function(node) {

        var scope = node.$parent.$scope,
            body = scope.node.body;

        return ast.getAssignments(body, node.id.name, node);

    },


    // Functions --------------------------------------------------------------
    getFunctionInfo: function(name, node) {

        // Collect generic function information
        var func = {
            type: null,
            name: name,
            isUpper: name[0].toUpperCase() === name[0],
            comment: node.$comment || node.$parent.$comment,
            returns: [],
            params: node.params.map(function(p) {
                return p.name;
            }),
            properties: [],
            superConstrutorCalls: [],
            superMethodCalls: []
        };

        ast.traverse(node.body, null, function(node) {

            // return ...;
            if (node.type === 'ReturnStatement') {
                func.returns.push(node);

            // Foo.call(this, ...); Foo.apply(this, ...);
            } else if (ast.functionFindSuperCalls(node, func)) {
                return;

            // this.foo = ...;
            } else if (node.type === 'AssignmentExpression'
                    && node.left.type === 'MemberExpression'
                    && node.left.object.type === 'ThisExpression'
                    && node.left.property.type === 'Identifier') {

                func.properties.push(node);

            }

        });

        return func;

    },

    getMethodInfo: function(name, node) {

        var func = {
            name: name,
            superConstrutorCalls: [],
            superMethodCalls: []
        };

        ast.traverse(node.body, null, function(node) {
            ast.functionFindSuperCalls(node, func);
        });

        return func;

    },

    functionFindSuperCalls: function(node, func) {

        var isCall = node.type === 'CallExpression'
                  && node.callee.type === 'MemberExpression'
                  && node.arguments.length
                  && node.arguments[0].type === 'ThisExpression';

        if (isCall) {

            var path = ast.getName(node.callee).split('.'),
                method = path.slice(-1)[0];

            if (method === 'call' || method === 'apply') {

                var pIndex = path.indexOf('prototype');
                if (pIndex !== -1) {
                    func.superMethodCalls.push({
                        base: path.slice(0, pIndex).join('.'),
                        method: path[pIndex + 1],
                        node: node
                    });

                } else {
                    func.superConstrutorCalls.push({
                        base: path.slice(0, -1).join('.'),
                        node: node
                    });
                }

            }

            return true;

        }

    }

};

module.exports = ast;

