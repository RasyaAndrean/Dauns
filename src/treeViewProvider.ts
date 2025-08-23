import * as vscode from 'vscode';
import { VariableInfo, scanVariablesInDocument } from './variableScanner';

// Tree item for individual variables
export class VariableTreeItem extends vscode.TreeItem {
  constructor(
    public readonly variable: VariableInfo,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(variable.name, collapsibleState);
    this.description = `${variable.type} (${variable.kind})`;
    this.tooltip = `Line ${variable.line}, Column ${variable.character}`;
    this.contextValue = 'variable';
  }
}

// Tree item for files
export class FileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly filePath: string,
    public readonly variables: VariableInfo[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(filePath, collapsibleState);
    this.description = `${variables.length} variables`;
    this.contextValue = 'file';
  }
}

// Main tree view provider
export class VariablesTreeViewProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | void
  > = this._onDidChangeTreeData.event;

  private variablesByFile: Map<string, VariableInfo[]> = new Map();

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    // If no element is provided, we're at the root level
    if (!element) {
      // Return files if we have multi-file support
      if (this.variablesByFile.size > 0) {
        const fileItems: FileTreeItem[] = [];
        this.variablesByFile.forEach((variables, filePath) => {
          fileItems.push(
            new FileTreeItem(
              filePath,
              variables,
              vscode.TreeItemCollapsibleState.Collapsed
            )
          );
        });
        return Promise.resolve(fileItems);
      }

      // For single file, return variables directly
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const variables = scanVariablesInDocument(editor.document);
        return Promise.resolve(
          variables.map(
            variable =>
              new VariableTreeItem(
                variable,
                vscode.TreeItemCollapsibleState.None
              )
          )
        );
      }
      return Promise.resolve([]);
    }

    // If element is a FileTreeItem, return its variables
    if (element instanceof FileTreeItem) {
      return Promise.resolve(
        element.variables.map(
          variable =>
            new VariableTreeItem(variable, vscode.TreeItemCollapsibleState.None)
        )
      );
    }

    return Promise.resolve([]);
  }

  // Update variables for a specific file
  updateVariables(filePath: string, variables: VariableInfo[]): void {
    this.variablesByFile.set(filePath, variables);
    this.refresh();
  }

  // Clear all variables
  clear(): void {
    this.variablesByFile.clear();
    this.refresh();
  }
}
