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
exports.RefactoringCommands = void 0;
const vscode = __importStar(require("vscode"));
const convertVariableProvider_1 = require("./convertVariableProvider");
const extractVariableProvider_1 = require("./extractVariableProvider");
const inlineVariableProvider_1 = require("./inlineVariableProvider");
const renameProvider_1 = require("./renameProvider");
class RefactoringCommands {
    /**
     * Registers all refactoring commands
     * @param context The extension context
     */
    static registerCommands(context) {
        // Register rename variable command
        const renameCommand = vscode.commands.registerCommand('dauns.renameVariable', async () => {
            // Get the variable name from the user
            const variableName = await vscode.window.showInputBox({
                prompt: 'Enter the variable name to rename',
                validateInput: (value) => {
                    if (!value) {
                        return 'Variable name cannot be empty';
                    }
                    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
                        return 'Invalid variable name format';
                    }
                    return null;
                },
            });
            if (!variableName) {
                return;
            }
            // Show preview of affected files
            const affectedFiles = await renameProvider_1.RenameProvider.previewRename(variableName);
            if (affectedFiles.length === 0) {
                vscode.window.showInformationMessage(`No files found containing variable '${variableName}'`);
                return;
            }
            // Show preview panel
            await renameProvider_1.RenameProvider.showPreviewPanel(variableName, affectedFiles);
            // Ask for confirmation
            const confirm = await vscode.window.showWarningMessage(`Rename variable '${variableName}' in ${affectedFiles.length} files?`, { modal: true }, 'Yes', 'Cancel');
            if (confirm !== 'Yes') {
                return;
            }
            // Get the new variable name
            const newName = await renameProvider_1.RenameProvider.showRenameInput(variableName);
            if (!newName) {
                return;
            }
            // Perform the rename
            await renameProvider_1.RenameProvider.renameVariable(variableName, newName, context);
        });
        // Register extract variable command
        const extractCommand = vscode.commands.registerCommand('dauns.extractVariable', async () => {
            await extractVariableProvider_1.ExtractVariableProvider.extractVariable(context);
        });
        // Register extract variable with smart naming command
        const extractSmartCommand = vscode.commands.registerCommand('dauns.extractVariableSmart', async () => {
            await extractVariableProvider_1.ExtractVariableProvider.extractWithSmartNaming(context);
        });
        // Register convert variable command
        const convertCommand = vscode.commands.registerCommand('dauns.convertVariable', async () => {
            await convertVariableProvider_1.ConvertVariableProvider.convertVariable(context);
        });
        // Register smart convert variable command
        const convertSmartCommand = vscode.commands.registerCommand('dauns.convertVariableSmart', async () => {
            await convertVariableProvider_1.ConvertVariableProvider.smartConvertVariable(context);
        });
        // Register inline variable command
        const inlineCommand = vscode.commands.registerCommand('dauns.inlineVariable', async () => {
            await inlineVariableProvider_1.InlineVariableProvider.inlineVariable(context);
        });
        // Add commands to context subscriptions
        context.subscriptions.push(renameCommand, extractCommand, extractSmartCommand, convertCommand, convertSmartCommand, inlineCommand);
    }
}
exports.RefactoringCommands = RefactoringCommands;
//# sourceMappingURL=refactoringCommands.js.map