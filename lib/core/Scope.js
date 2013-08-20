var ast = require('./ast');


// Scope Abstraction ----------------------------------------------------------
// ----------------------------------------------------------------------------
function Scope(node) {

    this.id = ++Scope.id;
    this.node = node;

    // Parent and child scopes
    this.parent = null;
    this.children = [];

    // A mapping of all names within the scope to their value node (value / function)
    this.names = {};

    // A mapping of all names within the scope to their definition node (identifier / function)
    this.origin = {};

    // Parameters
    this.params =  [];

    // Any functions declared in the scope
    this.functions = [];

    // Any var declarations
    this.declarations = [];

    // A mapping of all namespace paths to their values within the scope
    this.namespace = {};

    // A list of all top level expressions in the scope
    this.expressions = [];

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
            that.origin[param.name] = param;
            that.names[param.name] = param;
        });

        // add variable and function declarations to names, but ignore code in sub functions
        this.declarations = ast.traverse(node.body, function(node) {

            if (node.type === 'VariableDeclarator') {
                return true;

            } else if (ast.isFunction(node)) {

                if (node.type === 'FunctionDeclaration') {
                    that.functions.push(node);
                    that.origin[node.id.name] = node;
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
                value.$comment = dec.$parent.$comment;

                // Make sure to keep function references in tact
                that.origin[dec.id.name] = value;

            // The origin will point to the variable declarator
            } else {
                that.origin[dec.id.name] = dec.id;
            }

            // The names point to the value node
            that.names[dec.id.name] = value;
            that.namespace[dec.id.name] = value;

            that.declarations.push(value);

            return dec;

        });

        // find any other top level expressions
        var body = node.body.body || node.body; // Function / Program Node
        if (body) {
            body.forEach(function(stmt) {
                if (stmt.expression) {
                    that.addExpression(stmt.expression);
                }
            });
        }


    },

    initParent: function() {

        var that = this;

        // Find the scope's parent scope
        var parentNode = this.node.$parent;
        while(parentNode && !parentNode.hasOwnProperty('$$scope')) {
            parentNode = parentNode.$parent;
        }

        // Add parent reference if it exists
        if (parentNode) {

            this.parent = parentNode.$$scope;
            this.parent.children.push(this);

            // Setup scope for the scope node
            this.node.$scope = this.parent;

            // Handle function declarations / expressions
            if (this.node.id) {
                this.node.id.$scope = this.parent;
            }

        }

        // Set up scope references on parameters
        if (this.node.params) { // Program / Function
            this.node.params.forEach(function(p) {
                p.$scope = that;
            });
        }

        // Set up scope references on child nodes
        ast.traverse(this.node.body, function(node) {
            return node.hasOwnProperty('$$scope') ? null : true;

        }, function(node) {
            node.$scope = that;
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
            var path = ast.getName(node.left),
                parts = path.split('.'),
                root = parts[0];


            // Ignore property assignments and computed values
            // ignored computed properties and prototypes
            if (root !== 'this' && parts.indexOf('[]') === -1
                                && parts.indexOf('prototype') === -1) {

                var targetNode = that.resolveName(root);
                if (targetNode) {
                    var target = ast.getTarget(node.right, node.$scope);
                    if (target) {
                        targetNode.$scope.addNamespace(path, target);
                    }
                }

            }

        });

    },

    addNamespace: function(path, value) {
        this.namespace[path] = value;
    },

    addExpression: function(expr) {

        var that = this;
        if (expr.type === 'CallExpression' || expr.type === 'AssignmentExpression') {
            this.expressions.push(expr);

        } else if (expr.type === 'SequenceExpression') {
            expr.expressions.forEach(function(e) {
                that.addExpression(e);
            });
        }

    },


    // Methods ----------------------------------------------------------------
    resolveOrigin: function(name) {

        if (this.origin.hasOwnProperty(name)) {
            return this.origin[name];

        } else if (this.parent) {
            return this.parent.resolveOrigin(name);

        } else {
            return null;
        }

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

