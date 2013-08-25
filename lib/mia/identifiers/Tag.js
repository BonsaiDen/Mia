// Documentation Tags ---------------------------------------------------------
// ----------------------------------------------------------------------------
function BaseTag(type, id, name, comment) {
    this.type = type;
    this.id = id;
    this.name = name;
    this.comment = comment || null;
}

BaseTag.prototype = {

    merge: function(other) {
        this.id = this.id || other.id;
        this.name = this.name || other.name;
        this.comment = this.comment || other.comment;
    },

    annotate: function(parser) {
        if (this.comment instanceof Array) {
            parser(this);
        }
    }

};


// Properties -----------------------------------------------------------------
function PropertyTag(id, name, comment) {
    BaseTag.call(this, 'Property', id, name, comment);
}

PropertyTag.prototype = {

    empty: function() {
        return new PropertyTag(null, null, null);
    },

    merge: function(other) {
        BaseTag.prototype.merge.call(this, other);
    },

    annotate: function(parser) {
        BaseTag.prototype.annotate.call(this, parser);
    }

};


// Plain Functions ------------------------------------------------------------
function FunctionTag(id, name, comment, params) {
    BaseTag.call(this, 'Function', id, name, comment);
    this.params = params;
}

FunctionTag.prototype = {

    empty: function() {
        return new FunctionTag(null, null, null, []);
    },

    merge: function(other) {

        var that = this;
        BaseTag.prototype.merge.call(this, other);
        other.params.forEach(function(name) {
            if (that.params.indexOf(name) === -1) {
                that.params.push(name);
            }
        });

    },

    annotate: function(parser) {
        BaseTag.prototype.annotate.call(this, parser);
    }

};


// Factory Functions ----------------------------------------------------------
function FactoryTag(id, name, comment, params) {
    BaseTag.call(this, 'Factory', id, name, comment);
    this.params = params;
}

FactoryTag.prototype = {

    empty: function() {
        return new FactoryTag(null, null, null, []);
    },

    merge: function(other) {
        FunctionTag.prototype.merge.call(this, other);
    },

    annotate: function(parser) {
        BaseTag.prototype.annotate.call(this, parser);
    }

};


// Class Methods --------------------------------------------------------------
function MethodTag(id, name, comment, params, supers) {
    BaseTag.call(this, 'Method', id, name, comment);
    this.params = params;
    this.supers = supers || null;
}

MethodTag.prototype = {

    empty: function() {
        return new MethodTag(null, null, null, [], []);
    },

    merge: function(other) {
        var that = this;
        FunctionTag.prototype.merge.call(this, other);
        other.supers.forEach(function(id) {
            if (that.supers.indexOf(id) === -1) {
                that.supers.push(id);
            }
        });
    },

    annotate: function(parser) {
        BaseTag.prototype.annotate.call(this, parser);
    }

};


function ClassTag(id, name, comment) {
    BaseTag.call(this, 'Class', id, name, comment);
    this.bases = [];
    this.params = [];
    this.statics = [];
    this.members = [];
}

ClassTag.prototype = {

    empty: function() {
        return new ClassTag(null, null, null);
    },

    merge: function(other) {

        FunctionTag.prototype.merge.call(this, other);

        // Merge bases
        var that = this;
        other.bases.forEach(function(id) {
            if (that.bases.indexOf(id) === -1) {
                that.bases.push(id);
            }
        });

        // Merge static members
        other.statics.forEach(function(s) {
            that.addStatic(s);
        });

        // Merge all other members
        other.members.forEach(function(s) {
            that.addMember(s);
        });

    },

    annotate: function(parser) {

        BaseTag.prototype.annotate.call(this, parser);
        this.members.forEach(function(m) {
            m.annotate(parser);
        });

        this.statics.forEach(function(s) {
            s.annotate(parser);
        });

    },

    addBase: function(id) {
        if (this.bases.indexOf(id) === -1) {
            this.bases.push(id);
        }
    },

    addParam: function(name) {
        this.params.push(name);
    },

    addMember: function(tag) {
        if (!this.hasMember(tag.name)) {
            this.members.push(tag);
        }
    },

    addStatic: function(tag) {
        if (!this.hasStatic(tag.name)) {
            this.statics.push(tag);
        }
    },

    hasMember: function(name) {
        return this.members.some(function(m) {
            return m.name === name;
        });
    },

    hasStatic: function(name) {
        return this.statics.some(function(s) {
            return s.name === name;
        });
    }

};


// Exports --------------------------------------------------------------------
// ----------------------------------------------------------------------------
module.exports = {
    Method: MethodTag,
    Function: FunctionTag,
    Factory: FactoryTag,
    Property: PropertyTag,
    Class: ClassTag
};

