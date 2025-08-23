# Multi-Language Parser System for DAUNS Extension

## Overview

The DAUNS extension now supports variable detection across multiple programming languages through a flexible parser system. This system uses a common interface that allows for easy extension to additional languages.

## Implemented Parsers

### 1. JavaScript/TypeScript Parser

- **File Extensions**: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`
- **Features**:
  - Detects variables declared with `let`, `const`, and `var`
  - Identifies function and class declarations
  - Parses ES6 import statements and CommonJS require statements
  - Tracks variable references throughout the code

### 2. Python Parser

- **File Extensions**: `.py`, `.pyw`, `.pyx`
- **Features**:
  - Detects variable assignments (`x = value`)
  - Identifies function parameters in `def` statements
  - Recognizes class attributes (`self.attribute = value`)
  - Parses for loop variables (`for item in items:`)
  - Handles global and nonlocal declarations
  - Basic type inference for Python literals

### 3. Vue.js Parser

- **File Extensions**: `.vue`
- **Features**:
  - Parses JavaScript/TypeScript code in `<script>` sections
  - Detects template variables in `<template>` sections
  - Recognizes `v-for` loop variables
  - Identifies `v-model` bindings
  - Parses mustache interpolations (`{{ variable }}`)
  - Handles `v-bind` directives

### 4. JSON Parser

- **File Extensions**: `.json`, `.jsonc`
- **Features**:
  - Traverses JSON objects to identify properties
  - Handles JSONC (JSON with comments)
  - Provides type information for JSON values
  - Maps JSON properties to variable information

### 5. YAML Parser

- **File Extensions**: `.yml`, `.yaml`
- **Features**:
  - Parses key-value pairs and array items
  - Calculates scope based on indentation levels
  - Provides type inference for YAML values
  - Handles various YAML data types (strings, numbers, booleans, arrays, objects)

## Architecture

### Interface Design

All parsers implement the `ILanguageParser` interface:

```typescript
export interface ILanguageParser {
  language: string;
  fileExtensions: string[];
  parseVariables(content: string, filePath: string): VariableInfo[];
  parseImports(content: string): ImportInfo[];
  getVariableReferences(content: string, variableName: string): ReferenceInfo[];
  getSupportedRefactorings(): RefactoringType[];
}
```

### Parser Factory

The `ParserFactory` class manages all language parsers:

```typescript
export class ParserFactory {
  private parsers = new Map<string, ILanguageParser>();

  constructor() {
    this.registerDefaultParsers();
  }

  getParser(fileExtension: string): ILanguageParser | null;
  registerParser(parser: ILanguageParser): void;
  getSupportedExtensions(): string[];
}
```

## Integration

The parser system is integrated into the main extension through the `scanVariables` command in `extension.ts`. When a file is scanned, the extension:

1. Determines the file extension
2. Requests the appropriate parser from the `ParserFactory`
3. Uses the parser to analyze the file content
4. Falls back to the original JavaScript/TypeScript scanner if no parser is found

## Extensibility

To add support for a new language:

1. Create a new parser class that implements `ILanguageParser`
2. Register the parser in the `ParserFactory`
3. The new language will automatically be supported in the extension

## Benefits

- **Unified Interface**: All languages are handled through a consistent API
- **Easy Extension**: Adding new languages requires implementing the interface
- **Backward Compatibility**: Existing JavaScript/TypeScript functionality is preserved
- **Language-Specific Features**: Each parser can implement language-specific logic
- **Performance**: Only the relevant parser is used for each file type
