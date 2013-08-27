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

        return require('./mia/Parser').parse(name, source, config);

    },

    generate: function(module, options) {
        var Generator = require('./mia/Generator');
        return new Generator(options).generate(module);
    }

};

// Export mia now, so later requires will find it
module.exports = mia;


// Export utilitis and built-in parsers ---------------------------------------
// ----------------------------------------------------------------------------
mia.ast = require('./mia/util/ast');
mia.Tag = require('./mia/identifiers/Tag');
mia.Annotation = require('./mia/identifiers/Annotation');

mia.parsers = {

    source: {
        prototypical: require('./parser/source/prototypical')
    },

    module: {
        amd: require('./parser/module/amd'),
        iife: require('./parser/module/iife'),
        node: require('./parser/module/node'),
        umd: require('./parser/module/umd')
    },

    annotation: {
        mia: require('./parser/annotation/mia')
    }

};

