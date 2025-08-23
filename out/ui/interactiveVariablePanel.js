"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractiveVariablePanel = void 0;
const vscode = __importStar(require("vscode"));
class InteractiveVariablePanel {
    constructor() {
        this.disposables = [];
    }
    async show(variables) {
        if (this.panel) {
            this.panel.reveal();
        }
        else {
            this.panel = vscode.window.createWebviewPanel('daunsVariables', 'DAUNS Variables', vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            this.panel.onDidDispose(() => {
                this.panel = undefined;
                this.disposables.forEach(d => d.dispose());
                this.disposables = [];
            }, null, this.disposables);
        }
        this.panel.webview.html = this.generateWebviewContent(variables);
        this.setupWebviewMessageHandling();
    }
    generateWebviewContent(variables) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DAUNS Variables</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    .variable-item {
                        padding: 12px;
                        border: 1px solid var(--vscode-panel-border);
                        margin: 8px 0;
                        border-radius: 4px;
                        cursor: pointer;
                        background-color: var(--vscode-sideBar-background);
                    }
                    .variable-item:hover {
                        background-color: var(--vscode-list-hoverBackground);
                    }
                    .variable-name {
                        font-weight: bold;
                        font-size: 1.1em;
                        color: var(--vscode-list-highlightForeground);
                    }
                    .variable-type {
                        color: var(--vscode-editorInfo-foreground);
                    }
                    .variable-scope {
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
                    }
                    .variable-value {
                        font-family: 'Courier New', monospace;
                        background-color: var(--vscode-textBlockQuote-background);
                        padding: 4px 8px;
                        border-radius: 3px;
                        margin-top: 4px;
                        display: inline-block;
                    }
                    h2 {
                        color: var(--vscode-foreground);
                    }
                </style>
            </head>
            <body>
                <h2>Variables in Current File</h2>
                ${variables
            .map(v => `
                    <div class="variable-item" onclick="navigateToVariable('${v.name}', ${v.line})">
                        <div class="variable-name">${v.name}</div>
                        <div class="variable-type">Type: ${v.type}</div>
                        <div class="variable-scope">Scope: ${v.scope}</div>
                        ${v.value
            ? `<div class="variable-value">Value: ${v.value}</div>`
            : ''}
                    </div>
                `)
            .join('')}

                <script>
                    const vscode = acquireVsCodeApi();

                    function navigateToVariable(name, line) {
                        vscode.postMessage({
                            command: 'navigateToVariable',
                            name: name,
                            line: line
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }
    setupWebviewMessageHandling() {
        if (!this.panel)
            return;
        const disposable = this.panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'navigateToVariable':
                    this.navigateToVariable(message.name, message.line);
                    break;
            }
        });
        this.disposables.push(disposable);
    }
    navigateToVariable(name, line) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const position = new vscode.Position(line - 1, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        }
    }
    dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.InteractiveVariablePanel = InteractiveVariablePanel;
//# sourceMappingURL=interactiveVariablePanel.js.map