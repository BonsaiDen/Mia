// Imports --------------------------------------------------------------------
var ast = require('./ast');


// Interface ------------------------------------------------------------------
// ----------------------------------------------------------------------------
var parser = {

    parse: function(name, source, config) {

        var tree = ast.parse(source),
            struct = parser.parseStructures(tree, config),
            exports = parser.parseExports(name, tree, config);

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
                     parser.parseTags(tags, names, i, scope.namespace[i], config);
                }
            }

            // Run over all other top level calls and assignments in the scope
            var body = scope.node.body.body || scope.node.body; // Function / Program Node
            if (body) {
                body.forEach(function(stmt) {
                    if (stmt.expression) {
                        parser.parseExpressionStructure(tags, names, config, stmt.expression);
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
            parser.parseTags(tags, names, null, expr, config);

        } else if (expr.type === 'SequenceExpression') {
            expr.expressions.forEach(function(e) {
                parser.parseExpressionStructure(tags, names, config, e);
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

            var result = parser.applyParsers('source', config.source, [path, node]);
            if (result.length) {

                // Merge multiple tags into one
                var tag = result[0].empty();
                result.forEach(function(r) {
                    tag.merge(r);
                });

                // Replace the comment with the parsed annotation
                tag.annotate(function(tag) {
                    tag.comment = parser.parseAnnotations(tag.comment, config)[0] || null;
                });

                // ID's are unique to each ast node
                tags[uid] = tag;

                // Multiple names can map to the same ID
                names[uid] = [tag.name];

            }

        }

    },

    parseExports: function(moduleName, ast, config) {
        return parser.applyParsers('module', config.module, [moduleName, ast.body]);
    },

    parseAnnotations: function(node, config) {
        return parser.applyParsers('annotation', config.annotation, [node]);
    },


    // Helpers ----------------------------------------------------------------
    applyParsers: function(type, parsers, data) {

        var results = [];
        parsers.forEach(function(func) {
            var result = parser.executeParser(type, func, data);
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

    executeParser: function(type, func, data) {

        var mia = require('../mia');
        try {

            if (typeof func === 'string') {
                if (mia.parsers[type].hasOwnProperty(func)) {
                    return mia.parsers[type][func].parse.apply(null, data);

                } else {
                    throw new Error('No func found for "' + type + ':' + func + '"');
                }

            } else if (typeof func === 'function') {
                return func.apply(null, data);

            } else {
                throw new Error('Parser for "' + type + '" must be a string or a function.');
            }

        } catch(e) {
            throw e;
        }

    }

};

module.exports = parser;

