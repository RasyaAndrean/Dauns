import * as vscode from 'vscode';
import { ConvertVariableProvider } from './convertVariableProvider';
import { ExtractVariableProvider } from './extractVariableProvider';
import { InlineVariableProvider } from './inlineVariableProvider';
import { RenameProvider } from './renameProvider';

export class RefactoringCommands {
  /**
   * Registers all refactoring commands
   * @param context The extension context
   */
  static registerCommands(context: vscode.ExtensionContext): void {
    // Register rename variable command
    const renameCommand = vscode.commands.registerCommand(
      'dauns.renameVariable',
      async () => {
        // Get the variable name from the user
        const variableName = await vscode.window.showInputBox({
          prompt: 'Enter the variable name to rename',
          validateInput: (value: string) => {
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
        const affectedFiles = await RenameProvider.previewRename(variableName);

        if (affectedFiles.length === 0) {
          vscode.window.showInformationMessage(
            `No files found containing variable '${variableName}'`
          );
          return;
        }

        // Show preview panel
        await RenameProvider.showPreviewPanel(variableName, affectedFiles);

        // Ask for confirmation
        const confirm = await vscode.window.showWarningMessage(
          `Rename variable '${variableName}' in ${affectedFiles.length} files?`,
          { modal: true },
          'Yes',
          'Cancel'
        );

        if (confirm !== 'Yes') {
          return;
        }

        // Get the new variable name
        const newName = await RenameProvider.showRenameInput(variableName);
        if (!newName) {
          return;
        }

        // Perform the rename
        await RenameProvider.renameVariable(variableName, newName);
      }
    );

    // Register extract variable command
    const extractCommand = vscode.commands.registerCommand(
      'dauns.extractVariable',
      async () => {
        await ExtractVariableProvider.extractVariable();
      }
    );

    // Register extract variable with smart naming command
    const extractSmartCommand = vscode.commands.registerCommand(
      'dauns.extractVariableSmart',
      async () => {
        await ExtractVariableProvider.extractWithSmartNaming();
      }
    );

    // Register convert variable command
    const convertCommand = vscode.commands.registerCommand(
      'dauns.convertVariable',
      async () => {
        await ConvertVariableProvider.convertVariable();
      }
    );

    // Register smart convert variable command
    const convertSmartCommand = vscode.commands.registerCommand(
      'dauns.convertVariableSmart',
      async () => {
        await ConvertVariableProvider.smartConvertVariable();
      }
    );

    // Register inline variable command
    const inlineCommand = vscode.commands.registerCommand(
      'dauns.inlineVariable',
      async () => {
        await InlineVariableProvider.inlineVariable();
      }
    );

    // Add commands to context subscriptions
    context.subscriptions.push(
      renameCommand,
      extractCommand,
      extractSmartCommand,
      convertCommand,
      convertSmartCommand,
      inlineCommand
    );
  }
}
