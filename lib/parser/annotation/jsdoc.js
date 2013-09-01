// Dependencies ---------------------------------------------------------------
var Annotation = require('../../mia').Annotation;


// Parse JSDoc annotations ----------------------------------------------------
// ----------------------------------------------------------------------------
exports.parse = function(text, type) {

    var annotation = new Annotation(),
        tokens = tokenize(text);

    tokens.forEach(function(t) {

        // Visiblibility annotations
        if (t.title === 'private' || t.title === 'protected' || t.title === 'public') {
            annotation.setVisibility(t.title);

        // Types
        } else if (t.title === 'type') {
            annotation.setType(t.type);
            annotation.setDescription(t.description);

        // Handle return
        } else if (t.title === 'returns' || t.title === 'return') {
            annotation.setReturn(t.type, null, t.description);

        // Parameters
        } else if (t.title === 'param') {
            var param = annotation.addParameter(t.type, t.defaultValue, t.description);
            param.setOptional(t.optional || t.defaultValue !== null);

        // Set the description
        } else if (t.description !== null) {
            if (!annotation.getDescription()) {
                annotation.setDescription(t.description);
            }
        }

    });

    return annotation;

};


// Tokenizer ------------------------------------------------------------------
var tagToken = /^\@([a-zA-Z]+)/,
    typeToken = /^\{([a-zA-Z_\.\$0-9\[\]\=\|\?\!\(\)]+)\}/,
    separatorToken = /^\@|[^\\]\@/,
    typeDesc = /^(\?|\!|)?([a-zA-Z0-9_\.\$]+)(\[\])?(\=)?$/,
    paramNameToken = /^([a-zA-Z_\$0-9]+)/,
    paramDefaultToken = /^\[([a-zA-Z_\$0-9]+)(\=([^\\]+?))?\]/,
    dotEnd = /\.$/;

function tokenize(text) {

    function parseType(text, token) {

        // TODO handle nullable information
        var t = text.match(typeDesc);
        token.optional |= !!t[4];
        if (!!t[3]) {
            return {
                name: t[2],
                array: true
            };

        } else {
            return t[2];
        }

    }

    var tokens = [];
    while(text.length) {

        var token = {
            description: null,
            title: null,
            optional: false,
            type: null,
            defaultValue: null
        };

        // Tags
        var m;
        if ((m = text.match(tagToken))) {
            text = text.substring(m.index + m[0].length).trim();
            token.title = m[1];
        }

        if (token.title && !tagToken.test(text)) {

            // Types
            if ((m = text.match(typeToken))) {
                text = text.substring(m.index + m[0].length).trim();

                m = m[1];

                // Handle type unions
                if (m[0] === '(' && m.indexOf('|') !== -1) {
                    token.type = m.slice(1, -1).split('|').map(function(t) {
                        return parseType(t, token);
                    });

                } else{
                    token.type = parseType(m, token);
                }

                token.optional = !!token.optional;

            }

            // Parameter name and default value ign
            if (token.type && token.title === 'param') {

                if ((m = text.match(paramDefaultToken))) {
                    text = text.substring(m.index + m[0].length).trim();
                    token.name = m[1];
                    token.defaultValue = m[3];

                } else if ((m = text.match(paramNameToken))) {
                    text = text.substring(m.index + m[0].length).trim();
                    token.name = m[1];
                }

            }

        }

        // Description
        if ((m = text.match(separatorToken))) {
            token.description = text.substring(0, m.index + m[0].length - 1).trim();
            text = text.substring(m.index).trim();

        } else if (text.length) {
            token.description = text.trim();
            text = '';
        }

        token.description = token.description || null;

        if (token.title !== null || token.description !== null) {

            if (token.description && !dotEnd.test(token.description)) {
                token.description += '.';
            }

            tokens.push(token);

        }

    }

    return tokens;

}

