import { ParserFactory } from './parserFactory';

// Test the parser factory
const parserFactory = new ParserFactory();

// Test JavaScript parser
const jsParser = parserFactory.getParser('.js');
// eslint-disable-next-line no-console
console.log('JavaScript parser:', jsParser?.language);

// Test Python parser
const pyParser = parserFactory.getParser('.py');
// eslint-disable-next-line no-console
console.log('Python parser:', pyParser?.language);

// Test Vue parser
const vueParser = parserFactory.getParser('.vue');
// eslint-disable-next-line no-console
console.log('Vue parser:', vueParser?.language);

// Test JSON parser
const jsonParser = parserFactory.getParser('.json');
// eslint-disable-next-line no-console
console.log('JSON parser:', jsonParser?.language);

// Test YAML parser
const yamlParser = parserFactory.getParser('.yaml');
// eslint-disable-next-line no-console
console.log('YAML parser:', yamlParser?.language);

// Test supported extensions
// eslint-disable-next-line no-console
console.log('Supported extensions:', parserFactory.getSupportedExtensions());
