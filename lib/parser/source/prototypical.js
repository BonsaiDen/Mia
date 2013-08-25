// Dependencies ---------------------------------------------------------------
var mia = require('../../mia'),
    ast = mia.ast,
    Tag = mia.Tag;


// Parse "Standard" Prototypical Structures -----------------------------------
// ----------------------------------------------------------------------------
exports.parse = function(name, node) {

    // Only functions can be constructors, we also ingore functions without a name
    if (node.type !== 'FunctionExpression'
        && node.type !== 'FunctionDeclaration' || !node.id) {
        return null;
    }

    // Filter our possible members / statics of classes so they don't end up
    // on their own
    if (node.type === 'FunctionExpression' && node.$parent.type === 'AssignmentExpression') {

        var path = ast.getName(node.$parent.left).split('.'),
            baseName = path[0],
            baseValue = node.$scope.resolveName(baseName);

        // See if the node at the base is a function and the path is only 2 entries long
        // if so, it's probably a static function and should be ignored for now
        if (path.length === 2 && baseValue) {
            if (ast.isFunction(baseValue)) {
                return null;
            }
        }

        // Ignore everything which indirectly assigns to a prototype
        if (path.indexOf('prototype') !== -1) {
            return null;

        // Find the base value and assigned values of the base path
        } else if (baseValue) {

            var valuePath = ast.getName(baseValue).split('.');
            if (valuePath.indexOf('prototype') !== -1) {
                return null;
            }

            //base = node.$scope.resolveOrigin(baseName),
            // check the base if is being assigned a prototype somehwere

            // TODO go through assignments too
            //ast.getAssignmentToNode(base).forEach(function(assign) {
                //console.log(ast.getName(assign.left));
                //if (ast.getName(assign.left) === baseName) {
                    //console.log(assign);
                //}
            //});

        }

    }

    // Parse function
    var func = ast.getFunctionInfo(name, node);
    func.type = getFunctionType(func);

    // Plain functions
    if (func.type === 'Function') {
        return new Tag.Function(node.$uid, func.name, func.comment, func.params);

    // Factories
    } else if (func.type === 'Factory') {
        return new Tag.Factory(node.$uid, func.name, func.comment, func.params);

    // Class constructs
    } else if (func.type === 'Class') {

        var clas = new Tag.Class(node.$uid, name, func.comment);

        // Setup params
        func.params.forEach(clas.addParam.bind(clas));

        // Grab properties from the constructor
        func.properties.forEach(function(node) {
            clas.addMember(memberTag(node.left.property.name, node.$parent.$comment, node));
        });

        // Detect constructor super calls
        func.superConstrutorCalls.forEach(function(c) {
            c = node.$scope.resolveName(c.base);
            if (ast.isFunction(c)) {
                clas.addBase(c.$uid);
            }
        });

        // Find all assignments to the function node and parse them
        // TODO handle aliases of the function node
        ast.getAssignmentToNode(node).forEach(function(assign) {

            if (assign.left.type === 'MemberExpression') {

                var path = ast.getName(assign.left).split('.').slice(1),
                    comment = getComment(assign),
                    target = ast.getTarget(assign.right);

                // Instance members
                if (path[0] === 'prototype') {
                    addPrototype(clas, path, comment, target);

                // Static members
                } else {
                    clas.addStatic(staticTag(path[0], comment, target));
                }

            }

        });

        // Find all aliases of the prototype property and handle them too
        var aliases = ast.getAssignmentsFromName(name + '.prototype', node);
        aliases.forEach(function(alias) {
            ast.getAssignmentToNode(alias).forEach(function(assign) {

                var path = ast.getName(assign.left).split('.').slice(1),
                    comment = getComment(assign),
                    target = ast.getTarget(assign.right);

                // TODO detect inheritance by prototype assignment from other
                // classes like Bar.prototype.test = Foo.prototype.test
                if (target) {
                    addPrototype(clas, ['prototype', path[0]], comment, target);
                }

            });
        });

        return clas;

    }

};


// External Helper ------------------------------------------------------------
function getFunctionType(func) {

    if ((func.properties.length || func.superConstrutorCalls.length)) {
        return 'Class';

    } else if (func.returns.length && func.returnsNew) {
        return 'Factory';

    } else if (func.isUpper) {
        return 'Class';

    } else {
        return 'Function';
    }

}

exports.getFunctionType = getFunctionType;

function addPrototype(clas, path, comment, target) {

    // Single prototype assignment
    if (path.length === 2) {

        // Foo.prototype.constructor = Bar;
        if (path[1] === 'constructor') {
            if (ast.isFunction(target)) {
                clas.addBase(target.$uid);
            }

        // Foo.prototype.bar = ...;
        } else {
            clas.addMember(protoTag(clas, path[1], comment, target));
        }

    // Direct prototype assignment
    } else if (path.length === 1) {

        // Find full prototype assignments
        if (target.type === 'ObjectExpression') {

            // Add the prototype properties
            target.properties.forEach(function(prop) {

                var name = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value,
                    value = ast.getTarget(prop.value, prop.$parent.$scope);

                clas.addMember(protoTag(clas, name, prop.$comment, value));

            });

        // Find prototypical inheritance patterns
        } else if (target.type === 'CallExpression' && target.arguments.length) {

            // A.prototype = Object.create(B.prototype);
            if (ast.getName(target.callee) === 'Object.create') {

                // Resolve the original function which prototype is being used
                target = ast.getTarget(target.arguments[0], target.$scope, true);
                path = ast.getName(target).split('.').slice(0, -1).join('.');
                target = target.$scope.resolveName(path);

                if (target && ast.isFunction(target)) {
                    clas.addBase(target.$uid);
                }

            }

        // A.prototype = new B();
        } else if (target.type === 'NewExpression') {
            target = ast.getTarget(target.callee, target.$scope);
            if (ast.isFunction(target)) {
                clas.addBase(target.$uid);
            }
        }

    }

}

exports.addPrototype = addPrototype;


// Internal Helpers -----------------------------------------------------------
function getComment(node) {
    while(node.type === 'AssignmentExpression') {
        node = node.$parent;
    }
    return node.$comment;
}

function tag(name, comment, node) {

    if (ast.isFunction(node)) {

        var func = ast.getFunctionInfo(name, node);
        func.type = getFunctionType(func);

        // Factories
        if (func.type === 'Factory') {
            return new Tag.Factory(node.$uid, name, comment, func.params);

        // Plain functions
        } else {
            return new Tag.Function(node.$uid, name, comment, func.params);
        }

    } else {
        return new Tag.Property(node.$uid, name, comment);
    }

}

function memberTag(name, comment, node) {
    return tag(name, comment, node);
}

function staticTag(name, comment, node) {
    return tag(name, comment, node);
}

function protoTag(clas, name, comment, node) {

    if (ast.isFunction(node)) {

        var m = ast.getMethodInfo(name, node),
            supers = [];

        // Collect the id's of the bases which super methods are invoked
        m.superMethodCalls.forEach(function(c) {

            if (c.method === name) {
                var base = node.$scope.resolveName(c.base);
                if (base && clas.bases.indexOf(base.$uid) !== -1 ) {
                    supers.push(base.$uid);
                }
            }

        });

        var params = node.params.map(function(p) {
            return p.name;
        });

        return new Tag.Method(node.$uid, name, comment, params, supers);

    } else {
        return tag(name, comment, node);
    }

}

