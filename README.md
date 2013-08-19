## Mia - JavaScript Documentation Generator

**Mia** is a customizable documentation generator for JavaScript based on [esprima](https://github.com/ariya/esprima).

> Note: Mia is still in alpha status, right now it only comes with a few basic modules for parsing standard, prototypical code and it's own doc format.

Mia provides enhancements to the **AST** which are used by (custom) parser modules
to generate documentation for all kind of different JavaScript patterns and conventions.

It tries to be open minded about the source code it is parsing and not make any 
particular assumptions about structure or style.


### How it works

Mia works in 3 steps:

1. It parses the JavaScript source and creates a enhanced *AST* with additional informations about scopes and comments
2. It calls the user specificed parsers to detect exports, source structures and annotations
3. It merges the generated data and returns a JSON structure with all the information


### Usage

First Mia needs to parse the code in question, this is done by calling 
`mia.parse()` and specifying the parsers to be run over the source.

```javascript
var mia = require('mia'),
    fs = require('fs');

var source = fs.readFileSync('source.js').toString();
var module = mia.parse(
    'Module', // Name of the module
    source, 
    {
        modules: ['iife'], // Detect standard anonymous function wrappers
        sources: ['prototypical'], // Detect standrad prototypical classes
        annotations: ['mia'] // Use mia annotations
    }
);
```

`module` will be a serializable JSON structure which contains all information 
returned by the different parsers. An example can be found in [this gist](https://gist.github.com/BonsaiDen/6262270).

While the structure already contains all the required information to build 
documentation from it, the data is still not combined in a template friendly way.

By calling `mia.generate()` with the module and the matching *generator* a nicer 
structure can be generated which is easy to work with using standard template engines.

```javascript
var template = mia.generate(module, 'mia');
```


### Parsers

Below is a list of the parsers **Mia** currently ships with.:

- __Source Parsers__
    
    - `prototypical`

        - Detects classes, factories, members, static members and functions as well as prototypical inheritance and super calls to methods and constructors

- __Module Parsers__
    
    - `iife` 

        - Detects exports from immediately invoked function expression / anonymous wrapper

    - `amd`

        - Detects exports from asynchronous module definitions

    - `node`
        
        - Detects standard Node.js exports


- __Annotation Parsers__
    
    - `mia`
        
        - Parses Mia's own - lightweight - doc format.


It is easy to extend as you can just pass your custom functions to Mia instead 
of a parser name.


### Generators

The following generators are currently included:

- `mia`

    - Works perfectly with results from the built-in parsers, but should also work fine with most custom parsers.


## License

**Mia** is licenses under MIT.

