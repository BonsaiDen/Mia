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
                annotation.setReturn(t.type, null, t.description);

            // Add Parameters
            } else if (t.type !== null) {
                var param = annotation.addParameter(t.type, t.defaultValue, t.description);
                param.setOptional(t.optional || t.defaultValue !== null);

            // Set the description
            } else if (t.description !== null) {
                if (!annotation.getDescription()) {
                    annotation.setDescription(t.description);
                }
            }

            // Handle @options
            if (t.options.length) {

                // Visiblibility
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
var typeToken = /^\{([a-zA-Z_\$0-9\.\[\]\|\?]+)\}/,
    typeDesc = /^([a-zA-Z0-9_\.\$]+)(\[\])?(\??)$/,
    defaultToken = /^\(([^;]*)\)/,
    returnToken = /^\-\>/,
    optionToken = /^\@([a-zA-Z]+)/,
    separatorToken = /(^\;|([^\\])\;|\{|\-\>)/,
    dotEnd = /\.$/;

function tokenize(text) {

    // Remove newlines and superflous space characters
    text = text.replace(/\n+|\r+/g, ' ').replace(/\s+/g, ' ').trim();

    function parseType(text, token) {
        var t = text.match(typeDesc);
        token.optional |= !!t[3];
        if (!!t[2]) {
            return {
                name: t[1],
                array: true
            };

        } else {
            return t[1];
        }
    }

    var tokens = [];
    while(text.length) {

        var token = {
            isReturn: false,
            type: null,
            optional: false,
            defaultValue: null,
            description: null,
            options: []
        };

        // Options
        var m;
        if ((m = text.match(optionToken))) {
            text = text.substring(m.index + m[0].length).trim();
            token.options.push(m[1]);
        }

        // Return
        if ((m = text.match(returnToken))) {
            text = text.substring(m.index + m[0].length).trim();
            token.isReturn = true;
        }

        // Type
        if ((m = text.match(typeToken))) {

            text = text.substring(m.index + m[0].length).trim();

            m = m[1];
            if (m.indexOf('|') !== -1) {
                token.type = m.split('|').map(function(t) {
                    return parseType(t, token);
                });

            } else{
                token.type = parseType(m, token);
            }

            token.optional = !!token.optional;

        }

        if (token.type) {

            // Default value
            if ((m = text.match(defaultToken))) {
                text = text.substring(m.index + m[0].length).trim();
                token.defaultValue = m[1];
            }

            // Strip optional semicolon
            if (text.substring(0, 1) === ':') {
                text = text.substring(1).trim();
            }

        }

        // Find the first seperator
        if ((m = text.match(separatorToken))) {
            if (m[0] === '->' || m[0] === '{') {
                token.description = text.substring(0, m.index).trim();
                text = text.substring(m.index).trim();

            } else {
                token.description = text.substring(0, m.index + m[0].length - 1).trim();
                text = text.substring(m.index + 1).trim();
            }

        // Or the whole text
        } else if (text.length) {
            token.description = text.trim();
            text = '';
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

