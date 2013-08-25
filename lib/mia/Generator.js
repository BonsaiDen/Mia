// Dependencies ---------------------------------------------------------------
var Descriptor = require('./identifiers/Descriptor');


// Documentation Template Generator -------------------------------------------
// ----------------------------------------------------------------------------
function Generator(options) {

    // Options for output
    this.options = options || {
        visibility: null,
        untyped: false
    };

    // Default options
    this.options.visibility = this.options.visibility || ['public', 'protected', 'private'],
    this.options.untyped = this.options.untyped || false;

    // TODO add support for abstract?

    // Template data
    this.references = {};
    this.template = {
        name: null,
        properties: [],
        functions: [],
        factories: [],
        classes: []
    };

}

Generator.prototype = {

    generate: function(module) {

        var that = this;
        this.template.name = module.name;
        this.parseTags(module.exports, true);
        this.parseTags(module.related);
        this.template.classes.forEach(function(clas) {
            that.buildClass(clas);
        });

        return this.template;

    },

    buildClass: function(clas) {

        var that = this;
        clas.bases = clas.bases.map(function(id) {
            // Add circular references to base classes and mark methods as overrides
            return that.references[id].doc;
        });

        clas.members.forEach(function(m) {
            that.buildClassMembers(clas, m);
        });
    },

    buildClassMembers: function(clas, m) {

        // TODO atm super/base calls are only checked for methods
        // but not for static functions on the class
        if (m.id === 'Method') {

            var name = m.name;

            // See if any base class has a method with the same name
            var override = clas.bases.some(function(base) {
                return base.members.some(function(m) {
                    return m.id === 'Method' && m.name === name;
                });
            });

            // TODO See if the method calls the super class, if so, it's not a override
            m.override = override;

        }

    },

    parseTags: function(tags, isExport) {
        for(var i in tags) {
            if (tags.hasOwnProperty(i)) {
                this.parseTag(tags[i], i, isExport);
            }
        }
    },

    parseTag: function(tag, name, isExport) {

        var doc = Descriptor.create(this, tag, name, isExport);
        if (doc) {

            this.template[{
                Property: 'properties',
                Function: 'functions',
                Factory: 'factories',
                Class: 'classes'

            }[tag.type]].push(doc);

            this.references[tag.id] = {
                tag: tag,
                doc: doc
            };

        }

    }

};


// Exports --------------------------------------------------------------------
// ----------------------------------------------------------------------------
module.exports = Generator;

