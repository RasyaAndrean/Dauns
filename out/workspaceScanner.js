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
exports.WorkspaceScanner = void 0;
const vscode = __importStar(require("vscode"));
const variableScanner_1 = require("./variableScanner");
class WorkspaceScanner {
    constructor(treeViewProvider) {
        this.treeViewProvider = treeViewProvider;
    }
    // Scan all JavaScript/TypeScript files in the workspace
    async scanWorkspace() {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        // Clear previous results
        this.treeViewProvider.clear();
        // Find all JS/TS files in the workspace
        const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx}', '**/node_modules/**');
        if (files.length === 0) {
            vscode.window.showInformationMessage('No JavaScript/TypeScript files found in the workspace');
            return;
        }
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Scanning variables in workspace...',
            cancellable: true,
        }, async (progress, token) => {
            progress.report({
                increment: 0,
                message: `Scanning 0 of ${files.length} files`,
            });
            let scannedCount = 0;
            const variablesByFile = new Map();
            for (const file of files) {
                // Check if the operation was cancelled
                if (token.isCancellationRequested) {
                    break;
                }
                try {
                    // Open and scan the document
                    const document = await vscode.workspace.openTextDocument(file);
                    const variables = (0, variableScanner_1.scanVariablesInDocument)(document);
                    if (variables.length > 0) {
                        variablesByFile.set(file.fsPath, variables);
                        this.treeViewProvider.updateVariables(file.fsPath, variables);
                    }
                }
                catch (error) {
                    console.error(`Error scanning file ${file.fsPath}:`, error);
                }
                scannedCount++;
                progress.report({
                    increment: 100 / files.length,
                    message: `Scanning ${scannedCount} of ${files.length} files`,
                });
            }
            if (!token.isCancellationRequested) {
                vscode.window.showInformationMessage(`Scanned ${files.length} files. Found variables in ${variablesByFile.size} files.`);
            }
        });
    }
    // Scan a specific folder
    async scanFolder(folder) {
        // Find all JS/TS files in the folder
        const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/*.{js,ts,jsx,tsx}'), '**/node_modules/**');
        if (files.length === 0) {
            vscode.window.showInformationMessage('No JavaScript/TypeScript files found in the selected folder');
            return;
        }
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Scanning variables in folder...',
            cancellable: true,
        }, async (progress, token) => {
            progress.report({
                increment: 0,
                message: `Scanning 0 of ${files.length} files`,
            });
            let scannedCount = 0;
            const variablesByFile = new Map();
            for (const file of files) {
                // Check if the operation was cancelled
                if (token.isCancellationRequested) {
                    break;
                }
                try {
                    // Open and scan the document
                    const document = await vscode.workspace.openTextDocument(file);
                    const variables = (0, variableScanner_1.scanVariablesInDocument)(document);
                    if (variables.length > 0) {
                        variablesByFile.set(file.fsPath, variables);
                        this.treeViewProvider.updateVariables(file.fsPath, variables);
                    }
                }
                catch (error) {
                    console.error(`Error scanning file ${file.fsPath}:`, error);
                }
                scannedCount++;
                progress.report({
                    increment: 100 / files.length,
                    message: `Scanning ${scannedCount} of ${files.length} files`,
                });
            }
            if (!token.isCancellationRequested) {
                vscode.window.showInformationMessage(`Scanned ${files.length} files. Found variables in ${variablesByFile.size} files.`);
            }
        });
    }
}
exports.WorkspaceScanner = WorkspaceScanner;
//# sourceMappingURL=workspaceScanner.js.map