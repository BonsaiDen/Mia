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
function parseComment(text) {

    // Regular expressions
    var doubleLineBreakEx = /\r\n|\r/g,
        trailingWhiteSpaceEx = /\s+$/,
        leadingWhiteSpaceEx = /^\s*/;

    // Split into lines
    var lines = text.replace(doubleLineBreakEx, '\n').trim().split('\n');

    // Strip asteriks and trailing whitespace
    lines = lines.map(function(line) {
        return line.replace(trailingWhiteSpaceEx, '').substring(line.indexOf('*') + 1);
    });

    // Strip leading and trailing newlines
    var first = lines.length, last = 0;
    lines.forEach(function(line, i) {
        if (line.trim().length) {
            first = Math.min(first, i);
            last = Math.max(last, i);
        }
    });
    lines = lines.slice(first, last + 1);

    // Strip leading indentation blocks, ingoring empty lines
    var leading = lines.filter(function(line) {
        return line.trim().length > 0;

    }).map(function(line) {
        return line.match(leadingWhiteSpaceEx)[0].length;
    });

    // Find the biggest, common indentation across all lines and remove it
    leading = Math.min.apply(null, leading) || 0;
    if (leading > 0) {
        lines = lines.map(function(line) {
            return line.substring(leading);
        });
    }

    return lines.join('\n');

}

function attachComments(parser, ast) {

    ast = escodegen.attachComments(ast, ast.comments, ast.tokens);

    // Escogen attaches the first comments in the program to they "Program" token
    // But we want it to be on the first child instead, if possible
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
            node.$comment = parseComment(comments[0].value);
        }

        node.comments = null;
        node.leadingComments = null;
        node.trailingComments = null;

    });

}

function setupNodes(parser, ast) {

    var uid = 0;
    parser.traverse(ast, null, function(node, parent) {

        // Add parent references and uids
        node.$parent = parent;
        node.$uid = ++uid;

        // Clean up esprima properties and make the objects more similiar
        node.comments = null;
        node.leadingComments = null;
        node.trailingComments = null;
        node.extendedRange = null;
        node.range = null;
        node.tokens = null;

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

