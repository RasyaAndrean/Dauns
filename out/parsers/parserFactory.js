"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserFactory = void 0;
const javascriptParser_1 = require("./javascriptParser");
const jsonParser_1 = require("./jsonParser");
const pythonParser_1 = require("./pythonParser");
const vueParser_1 = require("./vueParser");
const yamlParser_1 = require("./yamlParser");
class ParserFactory {
    constructor() {
        this.parsers = new Map();
        this.registerDefaultParsers();
    }
    registerDefaultParsers() {
        const parsers = [
            new javascriptParser_1.JavaScriptParser(),
            new pythonParser_1.PythonParser(),
            new vueParser_1.VueParser(),
            new jsonParser_1.JsonParser(),
            new yamlParser_1.YamlParser(),
        ];
        parsers.forEach(parser => {
            parser.fileExtensions.forEach(ext => {
                this.parsers.set(ext, parser);
            });
        });
    }
    getParser(fileExtension) {
        return this.parsers.get(fileExtension) || null;
    }
    registerParser(parser) {
        parser.fileExtensions.forEach(ext => {
            this.parsers.set(ext, parser);
        });
    }
    getSupportedExtensions() {
        return Array.from(this.parsers.keys());
    }
}
exports.ParserFactory = ParserFactory;
//# sourceMappingURL=parserFactory.js.map