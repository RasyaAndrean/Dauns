import { JavaScriptParser } from './javascriptParser';
import { JsonParser } from './jsonParser';
import { PythonParser } from './pythonParser';
import { ILanguageParser } from './types';
import { VueParser } from './vueParser';
import { YamlParser } from './yamlParser';

export class ParserFactory {
  private parsers = new Map<string, ILanguageParser>();

  constructor() {
    this.registerDefaultParsers();
  }

  private registerDefaultParsers(): void {
    const parsers = [
      new JavaScriptParser(),
      new PythonParser(),
      new VueParser(),
      new JsonParser(),
      new YamlParser(),
    ];

    parsers.forEach(parser => {
      parser.fileExtensions.forEach(ext => {
        this.parsers.set(ext, parser);
      });
    });
  }

  getParser(fileExtension: string): ILanguageParser | null {
    return this.parsers.get(fileExtension) || null;
  }

  registerParser(parser: ILanguageParser): void {
    parser.fileExtensions.forEach(ext => {
      this.parsers.set(ext, parser);
    });
  }

  getSupportedExtensions(): string[] {
    return Array.from(this.parsers.keys());
  }
}
