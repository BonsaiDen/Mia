// Custom Error Class ---------------------------------------------------------
function MiaAstError(method, message) {
    this.name = "MiaAstError";
    this.message = method + ': ' + (message || '');
}

MiaAstError.prototype = Error.prototype;


// Mia AST Handling -----------------------------------------------------------
// ----------------------------------------------------------------------------
var ast = {

    // Public -----------------------------------------------------------------
    parse: function(source) {
        return require('./init').createAST(ast, source);
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
        validator = typeof validator === 'function' ? validator : function() { return true; };
        ast.traverseSub(node, validator, callback, parent || { type: 'File' }, results);
        return results;
    },

    traverseSub: function(node, validator, callback, parent, results) {

        if (node instanceof Array) {
            for(var i = 0, l = node.length; i < l; i++) {
                ast.traverseSub(node[i], validator, callback, parent, results);
            }

        } else if (node !== null) {

            // Run the validator function on the node if it exists
            var valid = validator(node, parent);

            // Skip sub tree and node if requested
            if (valid !== null) {

                for(var key in node) {

                    // Skip parent references or mia properties (prefixed with $)
                    if (key[0] !== '$'
                        && key !== 'type'
                        && key !== 'range'
                        && key !== 'tokens'
                        && key !== 'comments'
                        && key !== 'leadingComments'
                        && key !== 'trailingComments'
                        && key !== 'extendedRange'
                        && key !== 'kind'
                        && key !== 'operator'
                        && typeof node[key] === 'object') {

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

        if (!expr.hasOwnProperty('$name')) {
            expr.$name = ast.getNameUncached(expr, post);
        }

        return expr.$name;

    },

    getNameUncached: function(expr, post) {

        if (!expr) {
            throw new Error('getName', 'Invalid Node');

        } else if (expr.id) {
            return expr.id.name;

        } else if (expr.type === 'Identifier') {
            return expr.name;

        } else if (expr.type !== 'MemberExpression') {
            throw new Error('getName', 'Invalid Node: ' + expr.type);
        }

        var name;
        if (expr.object.type === 'Identifier') {
            name = expr.object.name;

        } else if (expr.object.type === 'ThisExpression') {
            name = 'this';

        } else {
            name = ast.getName(expr.object, name);
        }

        var property;
        if (expr.computed) {

            if (expr.property.type === 'Literal') {
                property = '' + expr.property.value;

            } else {
                property = '[...]';
            }

        } else {
            property = expr.property.name;
        }

        //var property = expr.computed ? '[]' : expr.property.name;
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
        var prev;
        while(node) {

            // Break out in case of self references
            if (prev === node) {
                break;
            }

            prev = node;

            // Look up identifiers
            if (node.type === 'Identifier') {
                node = scope.resolveName(node.name);

            // Look up member expressions
            } else if (node.type === 'MemberExpression' && !ignoreMembers) {
                node = scope.resolveName(ast.getName(node));

            // Move to right side of assignment expressions
            } else if (node.type === 'AssignmentExpression') {
                node = node.right;

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
    getAssignmentToNode: function(node) {
        var scope = node.$parent.$scope;
        return ast.getAssignments(scope.node.body, ast.getName(node), node);
    },

    getAssignmentsFromName: function(name, base) {

        var stack = [[name, base]],
            targets = [];

        // Recursively search for assignments
        while(stack.length) {

            var top = stack.shift(),
                nodes = ast.getAssignmentsFrom(top[0], top[1]);

            if (nodes.length === 0) {
                break;

            } else {

                // Push new things to look for onto the stack
                for(var i = 0, l = nodes.length; i < l; i++) {

                    var node = nodes[i];
                    if (node.type === 'Identifier' || node.type === 'MemberExpressionm') {
                        stack.push([ast.getName(node), node]);
                        targets.push(node);
                    }

                }

            }

        }

        return targets;

    },

    // Helpers
    getAssignments: function(node, name, nameOrigin) {

        function isValidAssignment(node) {
            if (node.type === 'AssignmentExpression') {

                if (node.left.type === 'MemberExpression') {
                    return true;

                } else if (node.left.type === 'Identifier') {
                    return true;
                }

            } else {
                return false;
            }

        }

        function validateAssignmentOrigin(node) {

            // Get the original node that declares the name
            // if it's the same as the one we're looking for
            // return the assignment node
            var name = ast.getName(node.left),
                baseName = name.substring(0, name.indexOf('.'));

            var originNode = node.$scope.resolveOrigin(baseName);
            if (nameOrigin === originNode) {
                return node;
            }

        }

        name = name || ast.getName(node);
        return ast.traverse(node, isValidAssignment, validateAssignmentOrigin);

    },

    getAssignmentsFrom: function(name, base) {

        var scope = base.$parent.$scope,
            targets = [],
            baseName = name.split('.')[0];

        function isAssignmentFrom(node) {

            // Grab all assignments and var declarations that init on
            // MemberExpressions or Identifiers
            // TODO var declarations on assignments?
            return node.type === 'AssignmentExpression'
                || (node.type === 'VariableDeclarator'
                    && node.init
                    && (node.init.type === 'MemberExpression'
                        || node.init.type === 'Identifier'));

        }

        function validateAssignmentTarget(node) {

            var to = null,
                from = null;

            if (node.type === 'AssignmentExpression') {
                if (ast.getName(node.left) === name) {
                    from = node.left;
                    to = node.right;
                }

            } else if (ast.getName(node.init) === name) {
                from = node.init;
                to = node.id;
            }

            if (from && to) {

                // Check whether the from node root is the base node
                var origin = from.$scope.resolveOrigin(baseName);
                if (origin === base) {
                    targets.push(to);
                }

            }

        }

        ast.traverse(scope.node.body, isAssignmentFrom, validateAssignmentTarget);
        return targets;

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
            returnsNew: false,
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

                var target = ast.getTarget(node.argument) || null;
                if (target && target.type === 'NewExpression') {
                    func.returnsNew = true;
                }

                func.returns.push(target);

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

