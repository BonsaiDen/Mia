var ast = require('./ast');


// Scope Abstraction ----------------------------------------------------------
// ----------------------------------------------------------------------------
function Scope(node) {

    this.id = ++Scope.id;
    this.node = node;

    // Parent and child scopes
    this.parent = null;
    this.children = [];

    // All mapped names within the scope (vars and params)
    this.names = {};

    // Parameters
    this.params =  [];

    // Any functions declared in the scope
    this.functions = [];

    // Any var declarations
    this.declarations = [];

    // A mapping of all namespace paths to their values within the scope
    this.namespace = {};

    // Parse the body of the scope
    this.init(node);

    node.$$scope = this;
    node.$scope = this;

}

Scope.id = 0;

Scope.prototype = {

    init: function(node) {

        var that = this;

        // Add parameters to names
        node.params && node.params.forEach(function(param) {
            that.params.push(param);
            that.names[param.name] = param;
        });

        // add variable and function declarations to names, but ignore code in sub functions
        this.declarations = ast.traverse(node.body, function(node) {

            if (node.type === 'VariableDeclarator') {
                return true;

            } else if (ast.isFunction(node)) {

                if (node.type === 'FunctionDeclaration') {
                    that.functions.push(node);
                    that.names[node.id.name] = node;
                    that.namespace[node.id.name] = node;
                }

                return null;

            }

        }, function(dec) {

            // Patch names and comments to function expressions when
            var value = dec.init ? dec.init : dec;
            if (value.type === 'FunctionExpression') {
                value.id = dec.id;
                value.$comment = dec.parent.$comment;
            }

            that.declarations.push(value);
            that.names[dec.id.name] = value;
            that.namespace[dec.id.name] = value;

            return dec;

        });

    },

    initNamespace: function() {

        // build internal namespaces by going through all member assignments
        var that = this;
        ast.traverse(this.node.body, function(node) {
            return node.type === 'AssignmentExpression'
                && node.left.type === 'MemberExpression';

        }, function(node) {

            // Resolve the scope of the root
            var path = ast.getMemberName(node.left),
                parts = path.split('.'),
                root = parts[0];

            // Ignore property assignments and computed values
            // ignored computed properties and prototypes
            if (root !== 'this' && parts.indexOf('[]') === -1
                                && parts.indexOf('prototype') === -1) {

                var targetName = that.resolveName(root);
                if (targetName) {
                    var target = ast.getTarget(node.right, node.$scope);
                    targetName.$scope.addNamespace(path, target);
                }

            }

        });

    },

    addNamespace: function(path, value) {
        this.namespace[path] = value;
    },

    resolveName: function(name) {

        if (this.names.hasOwnProperty(name)) {
            return this.names[name];

        } else if (this.namespace[name]) {
            return this.namespace[name];

        } else if (this.parent) {
            return this.parent.resolveName(name);

        } else {
            return null;
        }

    }

};


// Exports --------------------------------------------------------------------
// ----------------------------------------------------------------------------
module.exports = Scope;

