var mia = require('../../mia'),
    ast = mia.ast,
    tags = mia.tags;


// Parse "Standard" Prototypical Structures -----------------------------------
// ----------------------------------------------------------------------------
exports.parse = function(name, node) {

    // Only functions can be constructors, we also ingore functions without a name
    if (node.type !== 'FunctionExpression'
        && node.type !== 'FunctionDeclaration' || !node.id) {
        return null;
    }

    // Parse function
    var func = ast.getFunctionInfo(name, node);
    func.type = getFunctionType(func);

    // Plain functions
    if (func.type === 'Function') {
        return new tags.FunctionTag(node.$uid, func.name, func.comment, func.params);

    // Factories
    } else if (func.type === 'Factory') {
        return new tags.FactoryTag(node.$uid, func.name, func.comment, func.params);

    // Class constructs
    } else if (func.type === 'Class') {

        // TODO eliminate duplicates after parsing
        var clas = new tags.ClassTag(node.$uid, name, func.comment);

        // Setup params
        func.params.forEach(clas.addParam.bind(clas));

        // Grab properties from the constructor
        func.properties.forEach(function(node) {
            clas.addMember(memberTag(node.left.property.name, node.parent.$comment, node));
        });

        // Detect constructor super calls
        func.superConstrutorCalls.forEach(function(c) {
            c = node.$scope.resolveName(c.base);
            if (ast.isFunction(c)) {
                clas.addBase(c.$uid);
            }
        });

        // Find all related assignments and parse them
        ast.getNodeAssignments(node).forEach(function(assign) {

            if (assign.left.type === 'MemberExpression') {

                var path = ast.getMemberName(assign.left).split('.').slice(1),
                    comment = assign.parent.$comment,
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

        return clas;

    }

};


// External Helper ------------------------------------------------------------
function getFunctionType(func) {

    // Categorize the functions:
    // 1. Everything which has a "this" assign or a super valid call is a Class
    // 2. Everything which has a "return" and is upper case is a factory
    // 3. None of the above but the function starts with upper case
    // 4. Everything else is a plain function
    if (func.properties.length || func.superConstrutorCalls.length) {
        return 'Class';

    } else if (func.returns.length && func.isUpper) {
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
                    value = ast.getTarget(prop.value, prop.parent.$scope);

                clas.addMember(protoTag(clas, name, prop.$comment, value));

            });

        // Find prototypical inheritance patterns
        } else if (target.type === 'CallExpression' && target.arguments.length) {

            // A.prototype = Object.create(B.prototype);
            if (ast.getMemberName(target.callee) === 'Object.create') {

                // Resolve the original function which prototype is being used
                target = ast.getTarget(target.arguments[0], target.$scope, true);
                path = ast.getMemberName(target).split('.').slice(0, -1).join('.');
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
function tag(name, comment, node) {

    if (ast.isFunction(node)) {
        var params = node.params.map(function(p) {
            return p.name;
        });
        return new tags.FunctionTag(node.$uid, name, comment, params);

    } else {
        return new tags.PropertyTag(node.$uid, name, comment);
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

        return new tags.MethodTag(node.$uid, name, comment, params, supers);

    } else {
        return tag(name, comment, node);
    }

}

