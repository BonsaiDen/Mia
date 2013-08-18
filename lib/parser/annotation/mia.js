// Token Expressions
var typeToken = /^\{([a-zA-Z_$0-9\.]+)\}/,
    defaultToken = /^\((.*)\)/,
    returnToken = /^\-\>/,
    separatorToken = /(^\;|([^\\])\;)/;

function tokenize(line) {

    var tokens = [];
    while(line.length) {

        var token = {
            isReturn: false,
            type: null,
            defaultValue: null,
            description: null
        };

        // Return
        var m;
        if ((m = line.match(returnToken))) {
            line = line.substring(m.index + m[0].length).trim();
            token.isReturn = true;
        }

        // Type
        if ((m = line.match(typeToken))) {
            line = line.substring(m.index + m[0].length).trim();
            token.type = m[1];
        }

        if (token.type) {

            // Default value
            if ((m = line.match(defaultToken))) {
                line = line.substring(m.index + m[0].length).trim();
                token.defaultValue = m[1];
            }

            // Strip optional semicolon
            if (line.substring(0, 1) === ':') {
                line = line.substring(1).trim();
            }

        }

        // Description
        if ((m = line.match(separatorToken))) {
            token.description = line.substring(0, m.index + m[0].length - 1).trim();
            line = line.substring(m.index + 1).trim();

        } else if ((m = line.match(/\-\>/))) {
            token.description = line.substring(0, m.index).trim();
            line = line.substring(m.index).trim();

        // Or the whole line
        } else if (line.length) {
            token.description = line.trim();
            line = '';
        }

        token.description = token.description || null;

        if (token.type !== null || token.description !== null) {
            tokens.push(token);
        }

    }

    return tokens;

}

function annotate(tokens) {

    var annotation = {
        description: null,
        params: [],
        returns: null
    };

    // TODO throw when invalid doc is found?
    tokens.forEach(function(t) {

        var doc = {
            type: t.type,
            description: t.description,
            defaultValue: t.defaultValue
        };

        // Return type
        if (t.isReturn) {
            if (annotation.returns === null) {
                annotation.returns = doc;
            }

        // Parameters
        } else if (t.type !== null) {
            annotation.params.push(doc);

        // Description
        } else if (t.description !== null) {
            if (annotation.description === null) {
                annotation.description = t.description;
            }
        }

    });

    return annotation;

}


// Parse Mia's lightweight doc annotations ------------------------------------
// ----------------------------------------------------------------------------
exports.parse = function(lines) {
    return lines !== null ? annotate(tokenize(lines.join(' '))) : null;
};

