// Dependencies ---------------------------------------------------------------
var Annotation = require('./Annotation');


// Documetnation Descriptors---------------------------------------------------
// ----------------------------------------------------------------------------
var Descriptor = {

    // Factory ----------------------------------------------------------------
    // ------------------------------------------------------------------------
    create: function(generator, tag, name, isExport) {

        // Strip out undocumented parts
        if (tag.comment === null && generator.options.untyped !== true) {
            return null;
        }

        // Create a new doc entry
        if (Descriptor.hasOwnProperty(tag.type)) {

            var annotation = Descriptor.getAnnotation(tag.comment);

            // Filter based on visibility
            var visibility = annotation.getVisibility();
            if (visibility !== null
                && generator.options.visibility.indexOf(visibility) === -1) {

                return null;
            }

            return new Descriptor[tag.type](generator, tag, name, annotation, isExport || false);

        }

    },

    // Helper -----------------------------------------------------------------
    // ------------------------------------------------------------------------
    getTagParams: function(gen, tag) {
        return tag.params.map(function(name, i) {
            var annotation = Descriptor.getAnnotation(tag.comment ? tag.comment.params[i] : null);
            return new Descriptor.Parameter(gen, { type: 'Parameter' }, name, annotation, false);
        });
    },

    getTagProperties: function(gen, props) {
        return props.map(function(tag) {
            return Descriptor.create(gen, tag);

        }).filter(function(doc) {
            return doc !== null;

        }).sort(Descriptor.sortProperties);
    },

    SORT_ORDER: {
        'Property': 0,
        'Function': 1,
        'Method': 2,
        'Factory': 3
    },

    sortProperties: function(a, b) {
        if (a.id !== b.id) {
            return Descriptor.SORT_ORDER[a.id] - Descriptor.SORT_ORDER[b.id];

        } else if (a.name > b.name) {
            return 1;

        } else if (a.name < b.name) {
            return -1;

        } else {
            return 0;
        }
    },

    getAnnotation: function(comment) {
        return Annotation.fromComment(comment);
    },

    getDescription: function(annotation) {
        return annotation.getDescription(); // || (annotation.returns ? annotation.returns.getDescription() : null);
    },


    // Definitions ------------------------------------------------------------
    // ------------------------------------------------------------------------
    Base: function(gen, tag, name, annotation, isExport) {
        this.id = tag.type;
        this.name = name || tag.name;
        this.alias = tag.name || null; // TODO built full alias list
        this.isExport = isExport;
    },

    Factory: function(gen, tag, name, annotation, isExport) {
        Descriptor.Function.apply(this, arguments);
    },

    Function: function(gen, tag, name, annotation, isExport) {
        Descriptor.Base.apply(this, arguments);
        this.returnType = annotation.getReturn();
        this.description = Descriptor.getDescription(annotation);
        this.params = Descriptor.getTagParams(gen, tag);
    },

    Class: function(gen, tag, name, annotation, isExport) {

        Descriptor.Base.apply(this, arguments);

        this.bases = tag.bases.slice();
        this.statics = Descriptor.getTagProperties(gen, tag.statics);
        this.members = Descriptor.getTagProperties(gen, tag.members);

        this.description = Descriptor.getDescription(annotation);
        this.params = Descriptor.getTagParams(gen, tag);

    },

    Property: function(gen, tag, name, annotation, isExport) {

        Descriptor.Base.apply(this, arguments);

        annotation = Descriptor.getAnnotation(annotation.params[0]);
        this.type = annotation.getType();
        this.description = annotation.getDescription();
        this.defaultValue = annotation.getDefault();

    },

    Method: function(gen, tag, name, annotation, isExport) {
        Descriptor.Function.apply(this, arguments);
        this.override = false;
    },

    Parameter: function(gen, tag, name, annotation, isExport) {

        Descriptor.Base.apply(this, arguments);

        // TODO resolve this to a reference to the type if it is known
        this.type = annotation.getType();
        this.description = annotation.getDescription();
        this.defaultValue = annotation.getDefault();
    }

};


// Exports --------------------------------------------------------------------
// ----------------------------------------------------------------------------
module.exports = Descriptor;

