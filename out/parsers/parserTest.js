"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parserFactory_1 = require("./parserFactory");
// Test the parser factory
const parserFactory = new parserFactory_1.ParserFactory();
// Test JavaScript parser
const jsParser = parserFactory.getParser('.js');
console.log('JavaScript parser:', jsParser?.language);
// Test Python parser
const pyParser = parserFactory.getParser('.py');
console.log('Python parser:', pyParser?.language);
// Test Vue parser
const vueParser = parserFactory.getParser('.vue');
console.log('Vue parser:', vueParser?.language);
// Test JSON parser
const jsonParser = parserFactory.getParser('.json');
console.log('JSON parser:', jsonParser?.language);
// Test YAML parser
const yamlParser = parserFactory.getParser('.yaml');
console.log('YAML parser:', yamlParser?.language);
// Test supported extensions
console.log('Supported extensions:', parserFactory.getSupportedExtensions());
//# sourceMappingURL=parserTest.js.map