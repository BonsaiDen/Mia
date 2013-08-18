## Mia - JavaScript Documentation Generator

**Mia** is a customizable documentation generator for JavaScript based on [esprima](https://github.com/ariya/esprima).

> Note: Mia is still in alpha status, right now it only comes with a few basic modules for parsing standard, prototypical code and it's own doc format.

It provides additional parser functionality to work with scopes, references and 
other JavaScript features which then can be used by customized parser module to 
generate documentation for all kind of JavaScript patterns and conventions.

Mia's main goal is to be open minded about the source code it's being feed and 
not make any assumptions about its structure or style.


### How it works

Mia works in 3 steps:

1. It parses the JavaScript source and creates a enhanced *AST* with additional informations about scopes and comments .
2. It calls the user specificed plugins to detect exports, source structures and annotations.
3. It merges the generated data and returns it for use with a custom documentation generator.


### Usage

Below is an example of mia parsing a file with an outer anonymous function 
wrapper, prototypical source style and mia annotations.

```javascript
var mia = require('mia'),
    fs = require('fs');

var source = fs.readFileSync('source.js').toString();
var module = mia.parseModule(
    'Module', // Name of the module
    source, 
    {
        modules: ['iife'], // Detect standard anonymous function wrappers
        classes: ['prototypical'], // Detect standrad prototypical classes
        annotations: ['mia'] // Use mia annotations
    }
);
```
See: [Input and Output](https://gist.github.com/BonsaiDen/6262270)


### Features

Below is a list of the parsers **Mia** currently ships with. 
It can easily be extended though by simply passing a custom parser function to `mia.parseModule()`.

- __Source Parsers__
    
    - Prototypical Style

        - Detects classes, factories, members, static members and functions as well as prototypical inheritance and super calls to methods and constructors

- __Module Parsers__
    
    - IIFE (Immediately invoked function expression / anonymous wrapper)
    - AMD
    - Node.js

- __Annotation Parsers__


## License

**Mia** is licenses under MIT.

