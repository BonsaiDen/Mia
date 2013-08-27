// Dependencies ---------------------------------------------------------------
var Annotation = require('../../mia').Annotation;


// Parse Mia's lightweight doc annotations ------------------------------------
// ----------------------------------------------------------------------------
exports.parse = function(text, type) {

    var annotation = new Annotation(),
        tokens = tokenize(text);

    // Handle different Types
    if (type === 'Property') {
        if (tokens.length > 0) {
            annotation.setType(tokens[0].type);
            annotation.setDescription(tokens[0].description);
        }

    } else {
        tokens.forEach(function(t) {

            // Set up returns
            if (t.isReturn) {
                annotation.setReturn(t.type, t.defaultValue, t.description);

            // Add Parameters
            } else if (t.type !== null) {
                annotation.addParameter(t.type, t.defaultValue, t.description);

            // Set the description
            } else if (t.description !== null) {
                if (!annotation.getDescription()) {
                    annotation.setDescription(t.description);
                }
            }

            if (t.options.length) {
                if (t.options.indexOf('public') !== -1) {
                    annotation.setVisibility('public');

                } else if (t.options.indexOf('protected') !== -1) {
                    annotation.setVisibility('protected');

                } else if (t.options.indexOf('private') !== -1) {
                    annotation.setVisibility('private');
                }
            }

        });
    }

    return annotation;

};


// Tokenizer ------------------------------------------------------------------
var typeToken = /^\{([a-zA-Z_$0-9\.\[\]]+)\}/,
    defaultToken = /^\(([^;]*)\)/,
    returnToken = /^\-\>/,
    optionToken = /^\@([a-zA-Z]+)/,
    separatorToken = /(^\;|([^\\])\;|\{|\-\>)/,
    dotEnd = /\.$/;

function tokenize(line) {

    var tokens = [];
    while(line.length) {

        var token = {
            isReturn: false,
            type: null,
            defaultValue: null,
            description: null,
            options: []
        };

        // Options
        var m;
        if ((m = line.match(optionToken))) {
            line = line.substring(m.index + m[0].length).trim();
            token.options.push(m[1]);
        }

        // Return
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

        // Find the first seperator
        if ((m = line.match(separatorToken))) {
            if (m[0] === '->' || m[0] === '{') {
                token.description = line.substring(0, m.index).trim();
                line = line.substring(m.index).trim();

            } else {
                token.description = line.substring(0, m.index + m[0].length - 1).trim();
                line = line.substring(m.index + 1).trim();
            }

        // Or the whole line
        } else if (line.length) {
            token.description = line.trim();
            line = '';
        }

        token.description = token.description || null;

        if (token.type !== null || token.description !== null) {

            if (token.description && !dotEnd.test(token.description)) {
                token.description += '.';
            }

            tokens.push(token);

        }

    }

    return tokens;

}

