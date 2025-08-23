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
exports.VariablesTreeViewProvider = exports.FileTreeItem = exports.VariableTreeItem = void 0;
const vscode = __importStar(require("vscode"));
const variableScanner_1 = require("./variableScanner");
// Tree item for individual variables
class VariableTreeItem extends vscode.TreeItem {
    constructor(variable, collapsibleState) {
        super(variable.name, collapsibleState);
        this.variable = variable;
        this.collapsibleState = collapsibleState;
        this.description = `${variable.type} (${variable.kind})`;
        this.tooltip = `Line ${variable.line}, Column ${variable.character}`;
        this.contextValue = 'variable';
    }
}
exports.VariableTreeItem = VariableTreeItem;
// Tree item for files
class FileTreeItem extends vscode.TreeItem {
    constructor(filePath, variables, collapsibleState) {
        super(filePath, collapsibleState);
        this.filePath = filePath;
        this.variables = variables;
        this.collapsibleState = collapsibleState;
        this.description = `${variables.length} variables`;
        this.contextValue = 'file';
    }
}
exports.FileTreeItem = FileTreeItem;
// Main tree view provider
class VariablesTreeViewProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.variablesByFile = new Map();
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        // If no element is provided, we're at the root level
        if (!element) {
            // Return files if we have multi-file support
            if (this.variablesByFile.size > 0) {
                const fileItems = [];
                this.variablesByFile.forEach((variables, filePath) => {
                    fileItems.push(new FileTreeItem(filePath, variables, vscode.TreeItemCollapsibleState.Collapsed));
                });
                return Promise.resolve(fileItems);
            }
            // For single file, return variables directly
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const variables = (0, variableScanner_1.scanVariablesInDocument)(editor.document);
                return Promise.resolve(variables.map(variable => new VariableTreeItem(variable, vscode.TreeItemCollapsibleState.None)));
            }
            return Promise.resolve([]);
        }
        // If element is a FileTreeItem, return its variables
        if (element instanceof FileTreeItem) {
            return Promise.resolve(element.variables.map(variable => new VariableTreeItem(variable, vscode.TreeItemCollapsibleState.None)));
        }
        return Promise.resolve([]);
    }
    // Update variables for a specific file
    updateVariables(filePath, variables) {
        this.variablesByFile.set(filePath, variables);
        this.refresh();
    }
    // Clear all variables
    clear() {
        this.variablesByFile.clear();
        this.refresh();
    }
}
exports.VariablesTreeViewProvider = VariablesTreeViewProvider;
//# sourceMappingURL=treeViewProvider.js.map