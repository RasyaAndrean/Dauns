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
exports.RenameProvider = void 0;
const vscode = __importStar(require("vscode"));
class RenameProvider {
    /**
     * Renames a variable across the entire workspace
     * @param oldName The current name of the variable
     * @param newName The new name for the variable
     * @returns Promise that resolves when renaming is complete
     */
    static async renameVariable(oldName, newName, context) {
        try {
            // Validate input
            if (!oldName || !newName) {
                vscode.window.showErrorMessage('Both old and new variable names are required');
                return false;
            }
            if (oldName === newName) {
                vscode.window.showWarningMessage('New name is the same as the old name');
                return false;
            }
            // Find all files in the workspace
            const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx}', '**/node_modules/**');
            if (files.length === 0) {
                vscode.window.showInformationMessage('No JavaScript/TypeScript files found in the workspace');
                return false;
            }
            // Show progress while renaming
            const success = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Renaming variable '${oldName}' to '${newName}'`,
                cancellable: true,
            }, async (progress, token) => {
                progress.report({
                    increment: 0,
                    message: `Processing 0 of ${files.length} files`,
                });
                let processedCount = 0;
                let modifiedFiles = 0;
                for (const file of files) {
                    // Check if operation was cancelled
                    if (token.isCancellationRequested) {
                        break;
                    }
                    try {
                        // Open the document
                        const document = await vscode.workspace.openTextDocument(file);
                        // Check if the old variable name exists in this document
                        const text = document.getText();
                        const regex = new RegExp(`\\b${this.escapeRegExp(oldName)}\\b`, 'g');
                        if (regex.test(text)) {
                            // Perform the replacement
                            const edit = new vscode.WorkspaceEdit();
                            const newText = text.replace(regex, newName);
                            // Apply the edit
                            edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(text.length)), newText);
                            // Apply the workspace edit
                            const applied = await vscode.workspace.applyEdit(edit);
                            if (applied) {
                                modifiedFiles++;
                                // Save the document
                                const updatedDocument = await vscode.workspace.openTextDocument(file);
                                await updatedDocument.save();
                            }
                        }
                    }
                    catch (error) {
                        console.error(`Error processing file ${file.fsPath}:`, error);
                        // Continue with other files even if one fails
                    }
                    processedCount++;
                    progress.report({
                        increment: 100 / files.length,
                        message: `Processing ${processedCount} of ${files.length} files (${modifiedFiles} modified)`,
                    });
                }
                if (!token.isCancellationRequested) {
                    vscode.window.showInformationMessage(`Renamed '${oldName}' to '${newName}' in ${modifiedFiles} files`);
                    return true;
                }
                else {
                    vscode.window.showInformationMessage('Rename operation was cancelled');
                    return false;
                }
            });
            return success;
        }
        catch (error) {
            console.error('Error renaming variable:', error);
            vscode.window.showErrorMessage(`Failed to rename variable: ${error}`);
            return false;
        }
    }
    /**
     * Shows a preview of files that would be affected by a rename operation
     * @param oldName The current name of the variable
     * @returns Promise that resolves with array of affected file paths
     */
    static async previewRename(oldName) {
        try {
            // Find all files in the workspace
            const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx}', '**/node_modules/**');
            const affectedFiles = [];
            for (const file of files) {
                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    const text = document.getText();
                    const regex = new RegExp(`\\b${this.escapeRegExp(oldName)}\\b`, 'g');
                    if (regex.test(text)) {
                        affectedFiles.push(file.fsPath);
                    }
                }
                catch (error) {
                    console.error(`Error checking file ${file.fsPath}:`, error);
                }
            }
            return affectedFiles;
        }
        catch (error) {
            console.error('Error previewing rename:', error);
            vscode.window.showErrorMessage(`Failed to preview rename: ${error}`);
            return [];
        }
    }
    /**
     * Shows a rename input box to get the new variable name
     * @param oldName The current name of the variable
     * @returns Promise that resolves with the new name or undefined if cancelled
     */
    static async showRenameInput(oldName) {
        return vscode.window.showInputBox({
            prompt: `Enter new name for variable '${oldName}'`,
            value: oldName,
            validateInput: (value) => {
                if (!value) {
                    return 'Variable name cannot be empty';
                }
                if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
                    return 'Invalid variable name format';
                }
                if (value === oldName) {
                    return 'New name must be different from the old name';
                }
                return null;
            },
        });
    }
    /**
     * Shows a preview panel with affected files
     * @param oldName The current name of the variable
     * @param affectedFiles Array of affected file paths
     */
    static async showPreviewPanel(oldName, affectedFiles) {
        if (affectedFiles.length === 0) {
            vscode.window.showInformationMessage(`No files found containing variable '${oldName}'`);
            return;
        }
        const panel = vscode.window.createWebviewPanel('daunsRenamePreview', `Rename Preview: ${oldName}`, vscode.ViewColumn.One, {
            enableScripts: true,
        });
        let fileList = '<ul>';
        for (const file of affectedFiles) {
            fileList += `<li>${file}</li>`;
        }
        fileList += '</ul>';
        panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rename Preview</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          ul { list-style-type: none; padding: 0; }
          li { padding: 5px 0; border-bottom: 1px solid #eee; }
          .file-count { font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>Rename Preview</h1>
        <p>Variable <strong>'${oldName}'</strong> will be renamed in the following files:</p>
        <div class="file-count">${affectedFiles.length} file(s) affected</div>
        ${fileList}
      </body>
      </html>
    `;
    }
    /**
     * Escapes special regex characters in a string
     * @param string The string to escape
     * @returns The escaped string
     */
    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
exports.RenameProvider = RenameProvider;
//# sourceMappingURL=renameProvider.js.map