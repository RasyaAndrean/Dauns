import * as vscode from 'vscode';
import { VariablesTreeViewProvider } from './treeViewProvider';
import { VariableInfo, scanVariablesInDocument } from './variableScanner';

export class WorkspaceScanner {
  constructor(private treeViewProvider: VariablesTreeViewProvider) {}

  // Scan all JavaScript/TypeScript files in the workspace
  async scanWorkspace(): Promise<void> {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    // Clear previous results
    this.treeViewProvider.clear();

    // Find all JS/TS files in the workspace
    const files = await vscode.workspace.findFiles(
      '**/*.{js,ts,jsx,tsx}',
      '**/node_modules/**'
    );

    if (files.length === 0) {
      vscode.window.showInformationMessage(
        'No JavaScript/TypeScript files found in the workspace'
      );
      return;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Scanning variables in workspace...',
        cancellable: true,
      },
      async (progress, token) => {
        progress.report({
          increment: 0,
          message: `Scanning 0 of ${files.length} files`,
        });

        let scannedCount = 0;
        const variablesByFile = new Map<string, VariableInfo[]>();

        for (const file of files) {
          // Check if the operation was cancelled
          if (token.isCancellationRequested) {
            break;
          }

          try {
            // Open and scan the document
            const document = await vscode.workspace.openTextDocument(file);
            const variables = scanVariablesInDocument(document);

            if (variables.length > 0) {
              variablesByFile.set(file.fsPath, variables);
              this.treeViewProvider.updateVariables(file.fsPath, variables);
            }
          } catch (error) {
            console.error(`Error scanning file ${file.fsPath}:`, error);
          }

          scannedCount++;
          progress.report({
            increment: 100 / files.length,
            message: `Scanning ${scannedCount} of ${files.length} files`,
          });
        }

        if (!token.isCancellationRequested) {
          vscode.window.showInformationMessage(
            `Scanned ${files.length} files. Found variables in ${variablesByFile.size} files.`
          );
        }
      }
    );
  }

  // Scan a specific folder
  async scanFolder(folder: vscode.Uri): Promise<void> {
    // Find all JS/TS files in the folder
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(folder, '**/*.{js,ts,jsx,tsx}'),
      '**/node_modules/**'
    );

    if (files.length === 0) {
      vscode.window.showInformationMessage(
        'No JavaScript/TypeScript files found in the selected folder'
      );
      return;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Scanning variables in folder...',
        cancellable: true,
      },
      async (progress, token) => {
        progress.report({
          increment: 0,
          message: `Scanning 0 of ${files.length} files`,
        });

        let scannedCount = 0;
        const variablesByFile = new Map<string, VariableInfo[]>();

        for (const file of files) {
          // Check if the operation was cancelled
          if (token.isCancellationRequested) {
            break;
          }

          try {
            // Open and scan the document
            const document = await vscode.workspace.openTextDocument(file);
            const variables = scanVariablesInDocument(document);

            if (variables.length > 0) {
              variablesByFile.set(file.fsPath, variables);
              this.treeViewProvider.updateVariables(file.fsPath, variables);
            }
          } catch (error) {
            console.error(`Error scanning file ${file.fsPath}:`, error);
          }

          scannedCount++;
          progress.report({
            increment: 100 / files.length,
            message: `Scanning ${scannedCount} of ${files.length} files`,
          });
        }

        if (!token.isCancellationRequested) {
          vscode.window.showInformationMessage(
            `Scanned ${files.length} files. Found variables in ${variablesByFile.size} files.`
          );
        }
      }
    );
  }
}
