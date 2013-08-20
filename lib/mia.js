// Public Interface -----------------------------------------------------------
// ----------------------------------------------------------------------------
var mia = {

    parse: function(name, source, config) {

        function toArrayOption(option) {

            if (!(option instanceof Array)) {
                option = option ? [option] : [];
            }

            return option;

        }

        config.source = toArrayOption(config.source);
        config.module = toArrayOption(config.module);
        config.annotation = toArrayOption(config.annotation);

        return require('./core/parser').parse(name, source, config);

    },

    generate: function(generator, module) {

        try {
            if (typeof generator === 'string') {
                if (!mia.generators.hasOwnProperty(generator)) {
                    throw new Error('No generator with the name "' + generator + '" found.');

                } else {
                    return mia.generators[generator].generate(module);
                }

            } else if (typeof generator === 'function') {
                return generator.generate(module);

            } else {
                throw new Error('Generator must be a string or a function.');
            }

        } catch(e) {
            throw e;
        }

    }

};

// Export mia now, so later requires will find it
module.exports = mia;


// Export utilitis and built-in parsers ---------------------------------------
// ----------------------------------------------------------------------------
mia.ast = require('./core/ast');
mia.tags = require('./core/tags');

mia.parsers = {

    source: {
        prototypical: require('./parser/source/prototypical')
    },

    module: {
        amd: require('./parser/module/amd'),
        iife: require('./parser/module/iife'),
        node: require('./parser/module/node')
    },

    annotation: {
        mia: require('./parser/annotation/mia')
    }

};

mia.generators = {
    mia: require('./generator/mia')
};

