// Source Annotations ---------------------------------------------------------
// ----------------------------------------------------------------------------
function Annotation(type, defaultValue, description) {
    this.type = type || null;
    this.defaultValue = defaultValue || null;
    this.description = description || null;
    this.visibility = null;
    this.returns = null;
    this.params = [];
    this.fields = [];
}

// TODO add tests for all of this
// TODO rename to fromAnnotation
Annotation.fromComment = function(comment) {

    var annotation = new Annotation();
    if (comment) {

        annotation.setType(comment.type);
        annotation.setDefault(comment.defaultValue);
        annotation.setDescription(comment.description);
        annotation.setVisibility(comment.visibility);
        if (comment.returns) {
            annotation.setReturn(
                comment.returns.type,
                comment.returns.defaultValue,
                comment.returns.description
            );
        }

        if (comment.params) {
            comment.params.forEach(function(p) {
                annotation.addParameter(p.type, p.defaultValue, p.description);
            });
        }

        if (comment.fields) {
            comment.fields.forEach(function(f) {
                annotation.addField(f.type, f.defaultValue, f.description);
            });
        }

    }

    return annotation;

};

Annotation.prototype = {

    // Getter
    getDescription: function() {
        return this.description;
    },

    getVisibility: function() {
        return this.visibility;
    },

    getType: function() {
        return this.type;
    },

    getReturn: function() {
        return this.returns;
    },

    getDefault: function() {
        return this.defaultValue;
    },

    getParam: function(index) {
        return this.params[index] || null;
    },

    getParamCount: function() {
        return this.params.length;
    },

    // Setter
    setDescription: function(description) {
        this.description = description || null;
    },

    setVisibility: function(visibility) {
        this.visibility = visibility || null;
    },

    setType: function(type) {
        this.type = type || null;
    },

    setReturn: function(type, defaultValue, description) {
        this.returns = new Annotation(type, defaultValue, description);
    },

    setDefault: function(defaultValue) {
        this.defaultValue = defaultValue || null;
    },

    // Lists
    addParameter: function(type, defaultValue, description) {
        var p = new Annotation(type, defaultValue, description);
        this.params.push(p);
    },

    addField: function(type, defaultValue, description) {
        var f = new Annotation(type, defaultValue, description);
        this.fields.push(f);
    },

    serialize: function() {

        var json = {};

        for(var field in this) {
            if (this.hasOwnProperty(field)) {

                var value = this[field];
                if (value !== null) {

                    if (value instanceof Annotation) {
                        json[field] = value.serialize();

                    } else if (value instanceof Array) {

                        if (value.length > 0 ){
                            json[field] = value.map(function(v) {
                                if (v instanceof Annotation) {
                                    return v.serialize();

                                } else {
                                    return v;
                                }
                            });
                        }

                    } else {
                        json[field] = value;
                    }

                }

            }
        }

        return json;

    }

};


// Exports --------------------------------------------------------------------
// ----------------------------------------------------------------------------
module.exports = Annotation;

