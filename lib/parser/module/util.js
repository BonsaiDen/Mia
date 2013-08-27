// Dependencies ---------------------------------------------------------------
var ast = require('../../mia').ast;


// Helper Functions for Module Definitions ------------------------------------
// ----------------------------------------------------------------------------
var util = {

    getNameExports: function(moduleName, exportName, body) {

        // Collect all assignments to the exporting name
        var assignments = ast.getAssignments(body, exportName.name, exportName);

        // Now return a list of the things which get exported and
        // need to be looked to find classes and namespaces
        return assignments.map(function(node) {
            var target = ast.getTarget(node.right, node.$scope);
            if (target) {
                return {
                    name: moduleName + '.' + node.left.property.name,
                    id: target.$uid
                };

            } else {
                return null;
            }

        }).filter(function(e) {
            return e !== null;
        });

    },

    getObjectExports: function(moduleName, object) {
        return object.properties.map(function(prop) {
            var value = ast.getTarget(prop.value);
            if (value) {
                return {
                    name: moduleName + '.' + ast.getName(prop.key),
                    id: value.$uid
                };

            } else {
                return null;
            }

        }).filter(function(e) {
            return e !== null;
        });
    }

};

// Exports --------------------------------------------------------------------
module.exports = util;

