// Imports --------------------------------------------------------------------
var mod = require('./core/module');


// Public Interface -----------------------------------------------------------
// ----------------------------------------------------------------------------
var mia = {

    // Export references
    ast: require('./core/ast'),
    tags: require('./core/tags'),


    // Parsing ----------------------------------------------------------------
    // ------------------------------------------------------------------------
    parse: function(name, source, config) {

        config.sources = config.sources || [];
        config.modules = config.modules || [];
        config.annotations = config.annotations || [];

        return mod.parse(name, source, config);

    },

    generate: function(generator, module) {

        try {
            if (typeof generator === 'string') {
                generator = generator.replace(/\.\./g, '');
                return require('./generator/' + generator).generate(module);

            } else if (typeof generator === 'function') {
                return generator.generate(module);

            } else {
                throw new Error('Generator must be a string or a function.');
            }

        } catch(e) {
            if (e.message.indexOf('find module') === -1) {
                throw e;

            } else {
                throw new Error('No generator with the name "' + generator + '" found.');
            }
        }

    }

};

module.exports = mia;

