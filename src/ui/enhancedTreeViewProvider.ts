import * as vscode from 'vscode';
import { VariableInfo } from '../parsers/types';

// Enhanced tree item for individual variables with additional information
export class EnhancedVariableTreeItem extends vscode.TreeItem {
  constructor(
    public readonly variable: VariableInfo,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly filePath?: string
  ) {
    super(variable.name, collapsibleState);

    // Enhanced description with more details
    this.description = `${variable.type} (${variable.declarationType})`;

    // Enhanced tooltip with comprehensive information
    this.tooltip = new vscode.MarkdownString(
      `**${variable.name}**\n\n` +
        `**Type:** ${variable.type}\n\n` +
        `**Declaration:** ${variable.declarationType}\n\n` +
        `**Location:** Line ${variable.line}, Column ${variable.character}\n\n` +
        `**Scope:** ${variable.scope}\n\n` +
        `${filePath ? `**File:** ${filePath}\n\n` : ''}` +
        `${variable.value ? `**Value:** ${variable.value}\n\n` : ''}` +
        `**References:** ${variable.references.length}`
    );
    this.tooltip.isTrusted = true;

    // Context value for contextual menu actions
    this.contextValue = 'enhancedVariable';

    // Icon based on variable type
    this.iconPath = this.getIconForType(variable.type);
  }

  private getIconForType(type: string): vscode.ThemeIcon {
    switch (type.toLowerCase()) {
      case 'string':
        return new vscode.ThemeIcon('symbol-string');
      case 'number':
        return new vscode.ThemeIcon('symbol-number');
      case 'boolean':
        return new vscode.ThemeIcon('symbol-boolean');
      case 'array':
        return new vscode.ThemeIcon('symbol-array');
      case 'object':
        return new vscode.ThemeIcon('symbol-object');
      case 'function':
        return new vscode.ThemeIcon('symbol-function');
      default:
        return new vscode.ThemeIcon('symbol-variable');
    }
  }
}

// Tree item for files with variable count
export class EnhancedFileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly filePath: string,
    public readonly variables: VariableInfo[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(filePath, collapsibleState);
    this.description = `${variables.length} variables`;
    this.contextValue = 'enhancedFile';
    this.iconPath = vscode.ThemeIcon.File;
  }
}

// Tree item for filtered groups
export class FilterGroupTreeItem extends vscode.TreeItem {
  constructor(
    public readonly filterType: string,
    public readonly variables: VariableInfo[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly filePath?: string
  ) {
    super(filterType, collapsibleState);
    this.description = `${variables.length} variables`;
    this.contextValue = 'filterGroup';
    this.iconPath = new vscode.ThemeIcon('filter');
  }
}

// Enhanced tree view provider with filtering and search capabilities
export class EnhancedTreeViewProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | void
  > = this._onDidChangeTreeData.event;

  private variablesByFile: Map<string, VariableInfo[]> = new Map();
  private filterText: string = '';
  private groupBy: 'none' | 'type' | 'scope' | 'file' = 'none';
  private showOnlyUnused: boolean = false;
  private showOnlyShadowed: boolean = false;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  // Set filter text for searching
  setFilter(filterText: string): void {
    this.filterText = filterText.toLowerCase();
    this.refresh();
  }

  // Set grouping option
  setGrouping(groupBy: 'none' | 'type' | 'scope' | 'file'): void {
    this.groupBy = groupBy;
    this.refresh();
  }

  // Toggle showing only unused variables
  toggleShowOnlyUnused(): void {
    this.showOnlyUnused = !this.showOnlyUnused;
    this.refresh();
  }

  // Toggle showing only shadowed variables
  toggleShowOnlyShadowed(): void {
    this.showOnlyShadowed = !this.showOnlyShadowed;
    this.refresh();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    // If no element is provided, we're at the root level
    if (!element) {
      return this.getRootItems();
    }

    // If element is a FileTreeItem, return its variables
    if (element instanceof EnhancedFileTreeItem) {
      return Promise.resolve(
        this.getVariablesForFile(element.filePath, element.variables)
      );
    }

    // If element is a FilterGroupTreeItem, return its variables
    if (element instanceof FilterGroupTreeItem) {
      return Promise.resolve(
        element.variables.map(
          variable =>
            new EnhancedVariableTreeItem(
              variable,
              vscode.TreeItemCollapsibleState.None,
              element.filePath
            )
        )
      );
    }

    return Promise.resolve([]);
  }

  private getRootItems(): Thenable<vscode.TreeItem[]> {
    // Apply all filters
    const filteredVariablesByFile = this.applyFilters();

    // Handle grouping
    switch (this.groupBy) {
      case 'type':
        return Promise.resolve(this.groupByType(filteredVariablesByFile));
      case 'scope':
        return Promise.resolve(this.groupByScope(filteredVariablesByFile));
      case 'file':
        return Promise.resolve(this.groupByFile(filteredVariablesByFile));
      default:
        // No grouping - return files or variables directly
        if (filteredVariablesByFile.size > 1) {
          const fileItems: EnhancedFileTreeItem[] = [];
          filteredVariablesByFile.forEach((variables, filePath) => {
            if (variables.length > 0) {
              fileItems.push(
                new EnhancedFileTreeItem(
                  filePath,
                  variables,
                  vscode.TreeItemCollapsibleState.Collapsed
                )
              );
            }
          });
          return Promise.resolve(fileItems);
        } else if (filteredVariablesByFile.size === 1) {
          const [filePath, variables] = [
            ...filteredVariablesByFile.entries(),
          ][0];
          return Promise.resolve(
            variables.map(
              variable =>
                new EnhancedVariableTreeItem(
                  variable,
                  vscode.TreeItemCollapsibleState.None,
                  filePath
                )
            )
          );
        }
        return Promise.resolve([]);
    }
  }

  private getVariablesForFile(
    filePath: string,
    variables: VariableInfo[]
  ): vscode.TreeItem[] {
    // Apply grouping within a file
    switch (this.groupBy) {
      case 'type':
        return this.groupVariablesByType(variables, filePath);
      case 'scope':
        return this.groupVariablesByScope(variables, filePath);
      default:
        return variables.map(
          variable =>
            new EnhancedVariableTreeItem(
              variable,
              vscode.TreeItemCollapsibleState.None,
              filePath
            )
        );
    }
  }

  // Apply all filters to variables
  private applyFilters(): Map<string, VariableInfo[]> {
    const filteredVariablesByFile: Map<string, VariableInfo[]> = new Map();

    this.variablesByFile.forEach((variables, filePath) => {
      let filteredVariables = [...variables];

      // Apply text filter
      if (this.filterText) {
        filteredVariables = filteredVariables.filter(
          variable =>
            variable.name.toLowerCase().includes(this.filterText) ||
            variable.type.toLowerCase().includes(this.filterText) ||
            variable.declarationType.toLowerCase().includes(this.filterText)
        );
      }

      // Apply unused filter
      if (this.showOnlyUnused) {
        filteredVariables = filteredVariables.filter(
          variable => variable.references.length === 0
        );
      }

      // Apply shadowed filter (this is a simplified check)
      if (this.showOnlyShadowed) {
        // In a real implementation, we would check for actual shadowing
        // For now, we'll just filter variables with the same name in the same file
        const variableNames = filteredVariables.map(v => v.name);
        const duplicateNames = variableNames.filter(
          (name, index) => variableNames.indexOf(name) !== index
        );
        filteredVariables = filteredVariables.filter(variable =>
          duplicateNames.includes(variable.name)
        );
      }

      filteredVariablesByFile.set(filePath, filteredVariables);
    });

    return filteredVariablesByFile;
  }

  // Group variables by type across all files
  private groupByType(
    filteredVariablesByFile: Map<string, VariableInfo[]>
  ): vscode.TreeItem[] {
    const variablesByType: Map<string, VariableInfo[]> = new Map();

    filteredVariablesByFile.forEach(variables => {
      variables.forEach(variable => {
        const type = variable.type || 'unknown';
        if (!variablesByType.has(type)) {
          variablesByType.set(type, []);
        }
        variablesByType.get(type)!.push(variable);
      });
    });

    const groupItems: FilterGroupTreeItem[] = [];
    variablesByType.forEach((variables, type) => {
      if (variables.length > 0) {
        groupItems.push(
          new FilterGroupTreeItem(
            type,
            variables,
            vscode.TreeItemCollapsibleState.Collapsed
          )
        );
      }
    });

    return groupItems;
  }

  // Group variables by scope across all files
  private groupByScope(
    filteredVariablesByFile: Map<string, VariableInfo[]>
  ): vscode.TreeItem[] {
    const variablesByScope: Map<string, VariableInfo[]> = new Map();

    filteredVariablesByFile.forEach(variables => {
      variables.forEach(variable => {
        const scope = variable.scope || 'unknown';
        if (!variablesByScope.has(scope)) {
          variablesByScope.set(scope, []);
        }
        variablesByScope.get(scope)!.push(variable);
      });
    });

    const groupItems: FilterGroupTreeItem[] = [];
    variablesByScope.forEach((variables, scope) => {
      if (variables.length > 0) {
        groupItems.push(
          new FilterGroupTreeItem(
            scope,
            variables,
            vscode.TreeItemCollapsibleState.Collapsed
          )
        );
      }
    });

    return groupItems;
  }

  // Group variables by file
  private groupByFile(
    filteredVariablesByFile: Map<string, VariableInfo[]>
  ): vscode.TreeItem[] {
    const fileItems: EnhancedFileTreeItem[] = [];
    filteredVariablesByFile.forEach((variables, filePath) => {
      if (variables.length > 0) {
        fileItems.push(
          new EnhancedFileTreeItem(
            filePath,
            variables,
            vscode.TreeItemCollapsibleState.Collapsed
          )
        );
      }
    });
    return fileItems;
  }

  // Group variables by type within a file
  private groupVariablesByType(
    variables: VariableInfo[],
    filePath: string
  ): vscode.TreeItem[] {
    const variablesByType: Map<string, VariableInfo[]> = new Map();

    variables.forEach(variable => {
      const type = variable.type || 'unknown';
      if (!variablesByType.has(type)) {
        variablesByType.set(type, []);
      }
      variablesByType.get(type)!.push(variable);
    });

    const groupItems: FilterGroupTreeItem[] = [];
    variablesByType.forEach((groupVariables, type) => {
      if (groupVariables.length > 0) {
        groupItems.push(
          new FilterGroupTreeItem(
            type,
            groupVariables,
            vscode.TreeItemCollapsibleState.Collapsed,
            filePath
          )
        );
      }
    });

    return groupItems;
  }

  // Group variables by scope within a file
  private groupVariablesByScope(
    variables: VariableInfo[],
    filePath: string
  ): vscode.TreeItem[] {
    const variablesByScope: Map<string, VariableInfo[]> = new Map();

    variables.forEach(variable => {
      const scope = variable.scope || 'unknown';
      if (!variablesByScope.has(scope)) {
        variablesByScope.set(scope, []);
      }
      variablesByScope.get(scope)!.push(variable);
    });

    const groupItems: FilterGroupTreeItem[] = [];
    variablesByScope.forEach((groupVariables, scope) => {
      if (groupVariables.length > 0) {
        groupItems.push(
          new FilterGroupTreeItem(
            scope,
            groupVariables,
            vscode.TreeItemCollapsibleState.Collapsed,
            filePath
          )
        );
      }
    });

    return groupItems;
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

  // Get all variables (for external use)
  getAllVariables(): VariableInfo[] {
    const allVariables: VariableInfo[] = [];
    this.variablesByFile.forEach(variables => {
      allVariables.push(...variables);
    });
    return allVariables;
  }
}
