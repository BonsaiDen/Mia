// Dependencies ---------------------------------------------------------------
var Scope = require('../Scope'),
    esprima = require('esprima'),
    escodegen = require('escodegen');


// Public ---------------------------------------------------------------------
// ----------------------------------------------------------------------------
exports.createAST = function(parser, source) {

    var ast = esprima.parse(source, {
        range: true,
        tokens: true,
        comment: true
    });

    attachComments(parser, ast);
    setupNodes(parser, ast);
    buildScopes(parser, ast);
    return ast;

};


// Internal -------------------------------------------------------------------
// ----------------------------------------------------------------------------
function attachComments(parser, ast) {

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

}

function setupNodes(parser, ast) {

    var uid = 0;
    ast.$map = {};

    // Add parent references and uid's
    parser.traverse(ast, null, function(node, parent) {
        node.$parent = parent;
        node.$uid = ++uid;
        ast.$map[uid] = node;
    });

}

function buildScopes(parser, ast) {

    // Create scopes for program and all functions nodes
    var scopes = [new Scope(ast)];
    parser.traverse(ast, parser.isFunction, function(node) {
        scopes.push(new Scope(node));
    });

    scopes.forEach(function(scope) {
        scope.initParent();
    });

    scopes.forEach(function(scope) {
        scope.initNamespace();
    });

    ast.$scopeList = scopes;

}

