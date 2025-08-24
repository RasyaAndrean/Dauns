import * as vscode from 'vscode';
import { scanVariablesInDocument } from '../variableScanner';

export class VariableBreadcrumbProvider
  implements vscode.DocumentSymbolProvider
{
  async provideDocumentSymbols(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentSymbol[]> {
    const variables: any[] = scanVariablesInDocument(document);
    const symbols: vscode.DocumentSymbol[] = [];

    // Group variables by kind (const, let, var)
    const kindGroups = this.groupByKind(variables);

    for (const [kind, vars] of kindGroups) {
      // Find the range of this kind - for now we'll use the entire document
      const kindRange = new vscode.Range(
        0,
        0,
        document.lineCount - 1,
        document.lineAt(document.lineCount - 1).text.length
      );

      const kindSymbol = new vscode.DocumentSymbol(
        kind,
        'Variable Kind',
        vscode.SymbolKind.Namespace,
        kindRange,
        new vscode.Range(0, 0, 0, 0)
      );

      for (const variable of vars) {
        const varRange = new vscode.Range(
          variable.line - 1,
          variable.character - 1,
          variable.line - 1,
          variable.character - 1 + variable.name.length
        );

        const varSymbol = new vscode.DocumentSymbol(
          variable.name,
          variable.type,
          this.getSymbolKind(variable.type),
          varRange,
          varRange
        );

        kindSymbol.children.push(varSymbol);
      }

      symbols.push(kindSymbol);
    }

    return symbols;
  }

  private groupByKind(variables: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();

    for (const variable of variables) {
      const kind = variable.kind || 'unknown';
      if (!groups.has(kind)) {
        groups.set(kind, []);
      }
      groups.get(kind)!.push(variable);
    }

    return groups;
  }

  private getSymbolKind(type: string): vscode.SymbolKind {
    switch (type.toLowerCase()) {
      case 'function':
        return vscode.SymbolKind.Function;
      case 'object':
        return vscode.SymbolKind.Object;
      case 'array':
        return vscode.SymbolKind.Array;
      case 'string':
        return vscode.SymbolKind.String;
      case 'number':
        return vscode.SymbolKind.Number;
      case 'boolean':
        return vscode.SymbolKind.Boolean;
      default:
        return vscode.SymbolKind.Variable;
    }
  }
}
