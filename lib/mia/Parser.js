// Dependencies ---------------------------------------------------------------
var ast = require('./util/ast');


// Interface ------------------------------------------------------------------
// ----------------------------------------------------------------------------
var Parser = {

    parse: function(name, source, config) {

        var tree = ast.parse(source),
            struct = Parser.parseStructures(tree, config),
            exports = Parser.parseExports(name, tree, config);

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
            // TODO Alias exports to internals?
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
                     Parser.parseTags(tags, names, i, scope.namespace[i], config);
                }
            }

            // Run over all other top level calls and assignments in the scope
            var body = scope.node.body.body || scope.node.body; // Function / Program Node
            if (body) {
                body.forEach(function(stmt) {
                    if (stmt.expression) {
                        Parser.parseExpressionStructure(tags, names, config, stmt.expression);
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
            Parser.parseTags(tags, names, null, expr, config);

        } else if (expr.type === 'SequenceExpression') {
            expr.expressions.forEach(function(e) {
                Parser.parseExpressionStructure(tags, names, config, e);
            });
        }

    },

    parseTags: function(tags, names, path, node, config) {

        // Reference nodes instead of parsing them twice if we find them
        // referenced under multiple names
        var uid = node.$uid;

        // TODO does aliasing this still work correctly?
        if (tags.hasOwnProperty(uid)) {
            names[uid].push(path);

        } else {

            var result = Parser.collect('source', config.source, [path, node]);
            if (result) {
                result.forEach(function(tag) {
                    Parser.addTag(tags, names, tag, config);
                });
            }

        }

    },

    addTag: function(tags, names, tag, config) {

        var uid = tag.id,
            existing = tags[uid];

        if (existing) {
            existing.merge(tag);
            tag = existing;
        }

        // Replace the comment with the parsed annotation
        // TODO figure out how and whether to merge annotations
        tag.annotate(function(tag) {
            var annotation = Parser.parseAnnotations(tag, config)[0];
            if (annotation) {
                tag.comment = annotation.serialize();

            } else {
                tag.comment = null;
            }
        });

        // ID's are unique to each ast node
        tags[uid] = tag;

        // Multiple names can map to the same ID
        names[uid] = [tag.name];

    },

    parseExports: function(moduleName, ast, config) {
        return Parser.collect('module', config.module, [moduleName, ast.body]);
    },

    parseAnnotations: function(tag, config) {
        return Parser.collect('annotation', config.annotation, [
            tag.comment,
            tag.type
        ]);
    },


    // Helpers ----------------------------------------------------------------
    collect: function(type, parsers, data) {

        var results = [];
        parsers.forEach(function(func) {
            var result = Parser.execute(type, func, data);
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

    execute: function(type, func, data) {

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

module.exports = Parser;

