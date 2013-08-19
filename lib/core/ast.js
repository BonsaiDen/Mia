// Imports --------------------------------------------------------------------
var esprima = require('esprima'),
    escodegen = require('escodegen');


// Mia AST Parser -------------------------------------------------------------
// ----------------------------------------------------------------------------
var parser = {

    // Public -----------------------------------------------------------------
    // ------------------------------------------------------------------------
    parse: function(source) {

        var ast = esprima.parse(source, {
            range: true,
            tokens: true,
            comment: true
        });

        parser.buildCommments(ast);
        parser.buildAst(ast);
        parser.buildScopes(ast);

        return ast;

    },

    buildCommments: function(ast) {

        ast = escodegen.attachComments(ast, ast.comments, ast.tokens);

        // Escogen "wrongly" attaches the first comments in the program to they "Program" token
        // But we want it to be on the first child instead if possible
        if (ast.leadingComments && ast.body.length) {
            var first = ast.body[0];
            if (!first.leadingComments) {
                first.leadingComments = ast.leadingComments;
                ast.leadingComments = [];
            }
        }

        // Remove cruft from doc comments and attach them directly to the nodes
        parser.traverse(ast, function(node) {
            return node.leadingComments && node.leadingComments.length;

        }, function(node) {

            var comments = node.leadingComments.filter(function(d) {
                return d.type === 'Block';
            });

            if (comments.length) {
                node.$comment = comments[0].value.trim().split('\n').map(function(line) {
                    line = line.trim();
                    return line.substring(line.indexOf('*') + 1).trim();

                }).filter(function(line) {
                    return line.length > 0;
                });
            }

            node.leadingComments = null;

        });

    },

    buildAst: function(ast) {

        // Add parent reference to nodes
        var uid = 0;
        parser.traverse(ast, null, function(node, parent) {
            node.parent = parent;
            node.$uid = ++uid;
        });

    },

    buildScopes: function(ast) {

        var Scope = require('./Scope');


        var scopes = [new Scope(ast)];
        parser.traverse(ast, parser.isFunction, function(node) {
            scopes.push(new Scope(node));
        });

        // Parents / Children / Node References
        scopes.forEach(function(scope) {

            // Find the scope's parent scope
            var parent = scope.node.parent;
            while(parent && !parent.hasOwnProperty('$$scope')) {
                parent = parent.parent;
            }

            // Add parent reference if it exists
            if (parent) {

                scope.children.push(scope);
                scope.parent = parent.$$scope;

                // Setup scope for the scope node
                scope.node.$scope = scope.parent;
                if (scope.node.id) { // Declaration / Expression
                    scope.node.id.$scope = scope.parent;
                }

            }

            // Set up scope references on parameters
            if (scope.node.params) { // Program / Function
                scope.node.params.forEach(function(p) {
                    p.$scope = scope;
                });
            }

            // Set up scope references on child nodes
            parser.traverse(scope.node.body, function(node) {
                return node.hasOwnProperty('$$scope') ? null : true;

            }, function(node) {
                node.$scope = scope;
            });

        });

        // Namespaces
        scopes.forEach(function(scope) {
            scope.initNamespace();
        });

        ast.$scopeList = scopes;

    },


    // Helpers ----------------------------------------------------------------
    // ------------------------------------------------------------------------
    isFunction: function(node) {
        return node && (node.type === 'FunctionExpression'
            || node.type === 'FunctionDeclaration');
    },

    isGlobalName: function(scopeNode, name) {
        return scopeNode.$scope.resolveName(name) === null;
    },


    // Resolving --------------------------------------------------------------
    // ------------------------------------------------------------------------
    getTarget: function(node, scope, ignoreMembers) {

        scope = scope || node.$scope;

        while(node) {

            // Look up identifiers
            if (node.type === 'Identifier') {
                node = scope.resolveName(node.name);

            // Look up member expressions
            } else if (node.type === 'MemberExpression' && !ignoreMembers) {
                node = scope.resolveName(parser.getMemberName(node));

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

    getNodeAssignments: function(node) {

        var scope = node.parent.$scope,
            body = scope.node.body;

        return parser.findAssignmentsToName(body, node.id.name, node);

    },

    getMemberName: function(expr, post) {

        if (expr.type === 'Identifier') {
            return expr.name;
        }

        var name;
        if (expr.object.type === 'Identifier') {
            name = expr.object.name;

        } else if (expr.object.type === 'ThisExpression') {
            name = 'this';

        } else {
            name = parser.getMemberName(expr.object, name);
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

    getFunctionInfo: function(name, node) {

        // Collect generic function information
        var func = {
            type: null,
            name: name,
            isUpper: name[0].toUpperCase() === name[0],
            comment: node.$comment || node.parent.$comment,
            returns: [],
            params: node.params.map(function(p) {
                return p.name;
            }),
            properties: [],
            superConstrutorCalls: [],
            superMethodCalls: []
        };

        parser.traverse(node.body, null, function(node) {

            // return ...;
            if (node.type === 'ReturnStatement') {
                func.returns.push(node);

            // Foo.call(this, ...); Foo.apply(this, ...);
            } else if (parser.functionFindSuperCalls(node, func)) {
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

        parser.traverse(node.body, null, function(node) {
            parser.functionFindSuperCalls(node, func);
        });

        return func;

    },

    functionFindSuperCalls: function(node, func) {

        var isCall = node.type === 'CallExpression'
                  && node.callee.type === 'MemberExpression'
                  && node.arguments.length
                  && node.arguments[0].type === 'ThisExpression';

        if (isCall) {

            var path = parser.getMemberName(node.callee).split('.'),
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

    },


    // Raw Helpers ------------------------------------------------------------
    // ------------------------------------------------------------------------
    findAssignmentsToName: function(node, name, nameOrigin) {

        return parser.traverse(node, function(node) {
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
            var name = parser.getMemberName(node.left);
            var originNode = node.$scope.resolveName(name.substring(0, name.indexOf('.')));
            if (nameOrigin === originNode) {
                return node;
            }

        });

    },

    traverse: function(node, check, func, parent, data) {

        data = data || [];

        // Check if node is a valid target and skip the subtree if requested
        var valid = node.type && typeof check === 'function' && check(node, parent);
        if (valid === null) {
            return data;
        }

        for(var n in node) {
            if (node.hasOwnProperty(n)) {

                var prop = node[n];
                if (!prop || prop === parent || n === 'parent' || n.substring(0, 1) === '$') {
                    continue;

                } else if (prop.type) {
                    parser.traverse(prop, check, func, node.type ? node : parent, data);

                } else if (prop instanceof Array) {
                    parser.traverse(prop, check, func, node.type ? node : parent, data);
                }

            }
        }

        if (node.type) {
            if (!check || valid) {
                var result = func(node, parent || { type: 'File' });
                if (result) {
                    data.push(result);
                }
            }
        }

        return data;

    }

};

module.exports = parser;

