# Using DAUNS - Variable Detective

## How to Use the Extension

1. **Installation**: After installing the extension, it will be available in your VS Code editor.

2. **Activating the Extension**:

   - Open any JavaScript or TypeScript file (.js, .ts, .jsx, .tsx)
   - Right-click anywhere in the editor
   - Select "Scan Variables in Current File" from the context menu

3. **Viewing Variables**:

   - A Quick Pick menu will appear showing all detected variables
   - Each variable entry shows:
     - Variable name (label)
     - Type and declaration kind (description)
     - Line and column position (detail)

4. **Navigating to Variables**:
   - Select any variable from the list
   - The editor will automatically navigate to that variable's declaration

## Supported Variable Types

The extension detects variables declared with:

- `const` - Constant variables
- `let` - Block-scoped variables
- `var` - Function-scoped variables

## Type Detection

The extension performs basic type inference based on the value assigned to variables:

- String literals: `"hello"`, `'world'`, `` `template` `` → `string`
- Number literals: `42`, `3.14` → `number`
- Boolean literals: `true`, `false` → `boolean`
- Array literals: `[1, 2, 3]` → `array`
- Object literals: `{ key: value }` → `object`
- Function expressions: `function() {}`, `() => {}` → `function`
- Other values: `unknown`

## Example

Given this JavaScript code:

```javascript
const appName = 'DAUNS Variable Detective';
let version = 1.0;
var isActivated = true;

function greetUser(name) {
  const greeting = 'Hello, ' + name + '!';
  let message = greeting + ' Welcome to ' + appName;
  var timestamp = new Date();

  return {
    greeting: greeting,
    message: message,
    timestamp: timestamp,
  };
}
```

The extension will detect:

- `appName` (const, string)
- `version` (let, number)
- `isActivated` (var, boolean)
- `name` (parameter, unknown)
- `greeting` (const, string)
- `message` (let, string)
- `timestamp` (var, unknown)
- `greetUser` (function name)

## Limitations

- The extension only analyzes the currently open file
- Type detection is basic and may not catch all cases
- Does not detect variables in nested scopes or closures
- Does not handle complex destructuring patterns

## Troubleshooting

If the extension doesn't work:

1. Ensure you're in a JavaScript or TypeScript file
2. Check that the file has a proper extension (.js, .ts, .jsx, .tsx)
3. Restart VS Code if the command doesn't appear in the context menu
