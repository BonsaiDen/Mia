// Generate data for use in documentation templates ---------------------------
// ----------------------------------------------------------------------------
exports.generate = function(module) {

    var template = {
        name: module.name,
        properties: [],
        functions: [],
        factories: [],
        classes: []
    };

    var references = {};

    // Add all tags to the template data
    addTags(template, references, module.exports);
    addTags(template, references, module.related);

    // Add circular references to base classes and mark methods as overrides
    template.classes.forEach(function(clas) {

        clas.bases = clas.bases.map(function(id) {
            return references[id].doc;
        });

        // TODO right now base calls are only checked for methods, but not for static
        // functions on the class
        clas.members.filter(function(m) {
            return m.id === 'Method';

        }).forEach(function(m) {

            var name = m.name;

            // See if any base class has a method with the same name
            var override = clas.bases.some(function(base) {
                return base.members.some(function(m) {
                    return m.id === 'Method' && m.name === name;
                });
            });

            // TODO See if the method calls the super class, if so, it's not a override

            //console.log(override);
            m.override = override;

        });

    });

    return template;

};


// Template Data Representations ----------------------------------------------
// ----------------------------------------------------------------------------
function PropertyDoc(tag, name) {

    var comment = tag.comment.params[0] || {
        type: null,
        description: null,
        defaultValue: null
    };

    this.id = 'Property';
    this.name = name || tag.name;
    this.type = comment.type;
    this.description = comment.description;

}

function FunctionDoc(tag, name) {
    this.id = 'Function';
    this.name = name || tag.name;
    this.returnType = tag.comment.returns ? tag.comment.returns.type : null;
    this.description = tag.comment.description || (tag.comment.returns ? tag.comment.returns.description : null);
    this.params = getTagParams(tag);
}

function FactoryDoc(tag, name) {
    FunctionDoc.call(this, tag, name);
    this.id = 'Factory';
}

function MethodDoc(tag, name) {
    FunctionDoc.call(this, tag, name);
    this.override = false;
    this.id = 'Method';
}

function ClassDoc(tag, name) {

    this.id = 'Class';
    this.name = name || tag.name;
    this.alias = tag.name; // TODO built full alias list
    this.description = tag.comment.description || (tag.comment.returns ? tag.comment.returns.description : null);
    this.params = getTagParams(tag);
    this.bases = tag.bases.slice();

    // Sort by type and then by name
    this.statics = tag.statics.map(createDoc).sort(sortDocs);

    // Sort by type and then by name
    this.members = tag.members.map(createDoc).sort(sortDocs);

}

function ParameterDoc(name, comment) {
    this.id = 'Parameter';
    this.name = name;
    this.type = comment.type; // TODO resolve this to a reference to the type if it is known
    this.description = comment.description;
    this.defaultValue = comment.defaultValue;
}


// Helper Functions -----------------------------------------------------------
// ----------------------------------------------------------------------------
function sortDocs(a, b) {
    if (a.id === b.id) {
        return a.name > b.name;

    } else if (a.id === 'Property' && b.id === 'Function') {
        return -1;
    }
}

function createDoc(tag, name) {

    if (tag.type === 'Property') {
        return new PropertyDoc(tag, name);

    } else if (tag.type === 'Function') {
        return new FunctionDoc(tag, name);

    } else if (tag.type === 'Method') {
        return new MethodDoc(tag, name);

    } else if (tag.type === 'Factory') {
        return new FactoryDoc(tag, name);

    } else if (tag.type === 'Class') {
        return new ClassDoc(tag, name);
    }

}

function getTagParams(tag) {
    return tag.params.map(function(name, i) {
        var param = tag.comment.params[i] || {
            type: null,
            description: null,
            defaultValue: null
        };
        return new ParameterDoc(name, param);
    });
}

function addTags(template, reference, tags) {
    for(var i in tags) {
        if (tags.hasOwnProperty(i)) {

            var tag = tags[i],
                doc = createDoc(tag, i);

            template[{
                Property: 'properties',
                Function: 'functions',
                Factory: 'factories',
                Class: 'classes'

            }[tag.type]].push(doc);

            reference[tag.id] = {
                tag: tag,
                doc: doc
            };

        }
    }
}

