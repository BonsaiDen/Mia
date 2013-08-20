// Imports --------------------------------------------------------------------
var ast = require('./ast');


// Interface ------------------------------------------------------------------
// ----------------------------------------------------------------------------
var mod = {

    parse: function(name, source, config) {

        var tree = ast.parse(source),
            struct = mod.parseStructures(tree, config),
            exports = mod.parseExports(name, tree, config);

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


    // Parsing ----------------------------------------------------------------
    // ------------------------------------------------------------------------
    parseStructures: function(ast, config) {

        // Parse namespace structures
        var tags = {}, // A id -> tag mapping
            names = {}; // A id -> [name, name] mapping

        ast.$scopeList.forEach(function(scope) {

            // Run over all namespaces
            for(var i in scope.namespace) {
                if (scope.namespace.hasOwnProperty(i)) {
                     mod.parseTags(tags, names, i, scope.namespace[i], config);
                }
            }

            // Run over all other top level calls and assignments in the scope
            var body = scope.node.body.body || scope.node.body; // Function / Program Node
            if (body) {
                body.forEach(function(stmt) {
                    if (stmt.expression) {
                        mod.parseExpressionStructure(tags, names, config, stmt.expression);
                    }
                });
            }

        });

        return {
            tags: tags,
            names: names
        };

    },

    parseExpressionStructure: function(tags, names, config, expr) {

        if (expr.type === 'CallExpression' || expr.type === 'AssignmentExpression') {
            mod.parseTags(tags, names, null, expr, config);

        } else if (expr.type === 'SequenceExpression') {
            expr.expressions.forEach(function(e) {
                mod.parseExpressionStructure(tags, names, config, e);
            });
        }

    },

    parseTags: function(tags, names, path, node, config) {

        // Reference nodes instead of parsing them twice if we find them
        // referenced under multiple names
        var uid = node.$uid;
        if (tags.hasOwnProperty(uid)) {
            names[uid].push(path);

        } else {

            var result = mod.applyParsers('source', config.sources, [path, node]);
            if (result.length) {

                // Merge multiple tags into one
                var tag = result[0].empty();
                result.forEach(function(r) {
                    tag.merge(r);
                });

                // Replace the comment with the parsed annotation
                tag.annotate(function(tag) {
                    tag.comment = mod.parseAnnotations(tag.comment, config)[0] || null;
                });

                // ID's are unique to each ast node
                tags[uid] = tag;

                // Multiple names can map to the same ID
                names[uid] = [tag.name];

            }

        }

    },

    parseExports: function(moduleName, ast, config) {
        return mod.applyParsers('module', config.modules, [moduleName, ast.body]);
    },

    parseAnnotations: function(node, config) {
        return mod.applyParsers('annotation', config.annotations, [node]);
    },


    // Helpers ----------------------------------------------------------------
    applyParsers: function(type, parsers, data) {

        var results = [];
        parsers.forEach(function(parser) {
            var result = mod.executeParser(type, parser, data);
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
                return require('../parser/' + type +'/' + parser).parse.apply(null, data);

            } else if (typeof parser === 'function') {
                return parser.apply(null, data);

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

module.exports = mod;

