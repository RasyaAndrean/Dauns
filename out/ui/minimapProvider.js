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
exports.MinimapProvider = void 0;
const vscode = __importStar(require("vscode"));
const variableScanner_1 = require("../variableScanner");
class MinimapProvider {
    constructor() {
        this.minimapDecoration = vscode.window.createTextEditorDecorationType({
            overviewRulerColor: new vscode.ThemeColor('editorInfo.foreground'),
            overviewRulerLane: vscode.OverviewRulerLane.Right,
        });
    }
    async updateMinimap(editor) {
        if (!editor || !this.isSupported(editor.document))
            return;
        const variables = (0, variableScanner_1.scanVariablesInDocument)(editor.document);
        const decorations = [];
        for (const variable of variables) {
            // Add variable declaration to minimap
            const range = new vscode.Range(variable.line - 1, variable.character - 1, variable.line - 1, variable.character - 1 + variable.name.length);
            decorations.push({
                range,
                hoverMessage: `Variable: ${variable.name} (${variable.type})`,
            });
        }
        editor.setDecorations(this.minimapDecoration, decorations);
    }
    isSupported(document) {
        const supportedExtensions = ['.js', '.ts', '.jsx', '.tsx'];
        const extension = document.fileName
            .substring(document.fileName.lastIndexOf('.'))
            .toLowerCase();
        return supportedExtensions.includes(extension);
    }
    dispose() {
        this.minimapDecoration.dispose();
    }
}
exports.MinimapProvider = MinimapProvider;
//# sourceMappingURL=minimapProvider.js.map