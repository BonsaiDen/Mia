var esprima = require('esprima'),
    escodegen = require('escodegen'),
    Scope = require('./core/Scope');


// Exports --------------------------------------------------------------------
// ----------------------------------------------------------------------------
var mia = {

    // Export references
    ast: require('./core/ast'),
    tags: require('./core/tags'),


    // Parsing ----------------------------------------------------------------
    // ------------------------------------------------------------------------
    parse: function(source) {

        var ast = esprima.parse(source, {
            range: true,
            tokens: true,
            comment: true
        });

        mia.buildCommments(ast);
        mia.buildAst(ast);
        mia.buildScopes(ast);

        return ast;

    },

    parseModule: function(name, source, config) {

        config.sources = config.sources || [];
        config.modules = config.modules || [];
        config.annotations = config.annotations || [];

        var ast = mia.parse(source),
            struct = mia.parseStructures(ast, config),
            exports = mia.parseExports(name, ast, config);

        return mia.createModule(name, struct, exports);

    },

    createModule: function(name, struct, exports) {

        var tags = struct.tags,
            names = struct.names,
            addedIds = [];

        var module = {
            name: name,
            exports: {},
            related: {},
            internal: {}
        };

        // Go through all exports and add them as public members of the module
        exports.forEach(function(e) {
            module.exports[e.name] = tags[e.id] || e;
            addedIds.push(+e.id);
        });

        // Now go through all exports again and add their non-public
        // references to the protected members of the module
        exports.forEach(function(e) {
            var tag = tags[e.id];
            if (tag && tag.bases instanceof Array) {
                tag.bases.forEach(function(id) {
                    if (addedIds.indexOf(+id) === -1) {
                        names[id].forEach(function(name) {
                            module.related[name] = tags[id];
                        });
                        addedIds.push(+id);
                    }
                });
            }
        });

        // Now go through everything that's left and add it to the private
        // members of the module
        for(var id in tags) {
            if (tags.hasOwnProperty(id)) {
                if (addedIds.indexOf(+id) === -1) {
                    names[id].forEach(function(name) {
                        module.internal[name] = tags[id];
                    });
                    addedIds.push(+id);
                }
            }
        }

        return module;

    },

    parseStructures: function(ast, config) {

        // Parse namespace structures
        var tags = {}, // A id -> tag mapping
            names = {}; // A id -> [name, name] mapping

        ast.$scopeList.forEach(function(scope) {
            for(var i in scope.namespace) {
                if (scope.namespace.hasOwnProperty(i)) {
                     mia.parseTags(tags, names, i, scope.namespace[i], config);
                }
            }
        });

        return {
            tags: tags,
            names: names
        };

    },

    parseTags: function(tags, names, path, node, config) {

        // Reference nodes instead of parsing them twice if we find them
        // referenced under multiple names
        var uid = node.$uid;
        if (tags.hasOwnProperty(uid)) {
            names[uid].push(path);

        } else {

            var result = mia.applyParsers('source', config.sources, [path, node]);
            if (result.length) {

                // Merge multiple tags into one
                var tag = result[0].empty();
                result.forEach(function(r) {
                    tag.merge(r);
                });

                // Replace the comment with the parsed annotation
                tag.annotate(function(tag) {
                    tag.comment = mia.parseAnnotations(tag.comment, config)[0] || null;
                });

                // ID's are unique to each ast node
                tags[uid] = tag;

                // Multiple names can map to the same ID
                names[uid] = [path];

            }

        }

    },

    parseExports: function(moduleName, ast, config) {
        return mia.applyParsers('module', config.modules, [moduleName, ast.body]);
    },

    parseAnnotations: function(node, config) {
        return mia.applyParsers('annotation', config.annotations, [node]);
    },


    // AST Processing ---------------------------------------------------------
    // ------------------------------------------------------------------------
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
        mia.ast.traverse(ast, function(node) {
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

        return ast;

    },

    buildAst: function(ast) {

        // Add parent reference to nodes
        var uid = 0;
        mia.ast.traverse(ast, null, function(node, parent) {
            node.parent = parent;
            node.$uid = ++uid;
        });

        return ast;

    },

    buildScopes: function(ast) {

        var scopes = [new Scope(ast)];
        mia.ast.traverse(ast, mia.ast.isFunction, function(node) {
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
            mia.ast.traverse(scope.node.body, function(node) {
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
        return ast;

    },


    // Helpers ----------------------------------------------------------------
    applyParsers: function(type, parsers, data) {

        var results = [];
        parsers.forEach(function(parser) {
            var result = mia.executeParser(type, parser, data);
            if (result) {
                if (result instanceof Array) {
                    results.push.apply(results, result);

                } else {
                    results.push(result);
                }
            }
        });

        return results;

    },

    executeParser: function(type, parser, data) {

        try {

            if (typeof parser === 'string') {
                parser = parser.replace(/\.\./g, '');
                return require('./parser/' + type +'/' + parser).parse.apply(null, data);

            } else if (typeof parser === 'function') {
                return parser.parse(data);

            } else {
                throw new Error('Parser for "' + type + '" must be a string or a function.');
            }

        } catch(e) {
            if (e.message.indexOf('find module') === -1) {
                throw e;

            } else {
                throw new Error('No parser found for "' + type + ':' + parser + '"');
            }
        }

    }

};

module.exports = mia;

