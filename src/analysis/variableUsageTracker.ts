import * as vscode from 'vscode';
import { VariableInfo } from '../parsers/types';

/**
 * Interface for tracking variable usage information
 */
export interface VariableUsageInfo extends VariableInfo {
  usageCount: number;
  declarationCount: number;
  isUnused: boolean;
  isWriteOnly: boolean;
  references: {
    line: number;
    character: number;
    context: string;
  }[];
}

/**
 * Variable Usage Tracker for counting references and analyzing usage patterns
 */
export class VariableUsageTracker {
  /**
   * Analyzes variable usage in a document
   * @param document The text document to analyze
   * @param variables The variables found in the document
   * @returns Enhanced variable information with usage tracking
   */
  static analyzeVariableUsage(
    document: vscode.TextDocument,
    variables: VariableInfo[]
  ): VariableUsageInfo[] {
    const text = document.getText();
    const usageInfo: VariableUsageInfo[] = [];

    for (const variable of variables) {
      const references = this.findVariableReferences(text, variable.name);

      // Count actual usages (excluding declaration)
      const usageCount = references.length;

      // For declaration count, we consider it as 1 since it's declared once
      const declarationCount = 1;

      // A variable is considered unused if it has no references
      const isUnused = usageCount === 0;

      // A variable is write-only if it's only assigned but never read
      const isWriteOnly = this.isWriteOnlyVariable(
        text,
        variable.name,
        references
      );

      usageInfo.push({
        ...variable,
        usageCount,
        declarationCount,
        isUnused,
        isWriteOnly,
        references,
      });
    }

    return usageInfo;
  }

  /**
   * Finds all references to a variable name in the document text
   * @param text The document text
   * @param variableName The name of the variable to find references for
   * @returns Array of reference positions and contexts
   */
  private static findVariableReferences(
    text: string,
    variableName: string
  ): VariableUsageInfo['references'] {
    const references: VariableUsageInfo['references'] = [];
    // Create a regex that matches the variable name as a whole word
    const regex = new RegExp(`\\b${this.escapeRegExp(variableName)}\\b`, 'g');
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Calculate line and character position
      const substr = text.substring(0, match.index);
      const lines = substr.split('\n');
      const line = lines.length;
      const character = lines[lines.length - 1].length + 1;

      // Get context around the match (50 characters before and after)
      const contextStart = Math.max(0, match.index - 50);
      const contextEnd = Math.min(
        text.length,
        match.index + variableName.length + 50
      );
      const context = text.substring(contextStart, contextEnd);

      references.push({
        line,
        character,
        context,
      });
    }

    return references;
  }

  /**
   * Determines if a variable is write-only (assigned but never read)
   * @param text The document text
   * @param variableName The variable name to check
   * @param references All references to the variable
   * @returns True if the variable is write-only
   */
  private static isWriteOnlyVariable(
    text: string,
    variableName: string,
    references: VariableUsageInfo['references']
  ): boolean {
    // If there are no references, it's unused, not write-only
    if (references.length === 0) {
      return false;
    }

    // Check if all references are in assignment contexts
    for (const ref of references) {
      // Get context around the reference
      const lineContext = text.split('\n')[ref.line - 1] || '';

      // Check if this is an assignment (simplistic check)
      const isAssignment =
        /[+\-*/%=]=|=[^=]/.test(lineContext) &&
        lineContext.includes(variableName);

      // If we find a reference that's not an assignment, it's not write-only
      if (!isAssignment) {
        return false;
      }
    }

    // All references are assignments, so it's write-only
    return references.length > 0;
  }

  /**
   * Escapes special regex characters in a string
   * @param string The string to escape
   * @returns The escaped string
   */
  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Shows variable usage information in a quick pick
   * @param usageInfo The variable usage information to display
   */
  static async showVariableUsage(
    usageInfo: VariableUsageInfo[]
  ): Promise<void> {
    if (usageInfo.length === 0) {
      vscode.window.showInformationMessage('No variables found!');
      return;
    }

    const quickPickItems = usageInfo.map(variable => {
      let description = `${variable.type} (${variable.declarationType})`;
      let detail = `Used ${variable.usageCount} time(s)`;

      if (variable.isUnused) {
        description += ' - UNUSED';
        detail += ' ⚠️';
      } else if (variable.isWriteOnly) {
        description += ' - WRITE-ONLY';
        detail += ' ⚠️';
      }

      return {
        label: variable.name,
        description,
        detail,
        variable,
      };
    });

    const selection = await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: 'Select a variable to see detailed usage information',
      matchOnDetail: true,
    });

    if (selection) {
      const selectedVariable = selection.variable as VariableUsageInfo;

      // Create a detailed message with usage information
      let message = `Variable: ${selectedVariable.name}\n`;
      message += `Type: ${selectedVariable.type}\n`;
      message += `Declaration: ${selectedVariable.declarationType}\n`;
      message += `Usage Count: ${selectedVariable.usageCount}\n`;
      message += `Status: ${
        selectedVariable.isUnused
          ? 'UNUSED'
          : selectedVariable.isWriteOnly
          ? 'WRITE-ONLY'
          : 'ACTIVE'
      }\n\n`;

      if (selectedVariable.references.length > 0) {
        message += 'References:\n';
        for (const ref of selectedVariable.references.slice(0, 5)) {
          // Limit to first 5 references
          message += `  Line ${ref.line}: ${ref.context.trim()}\n`;
        }
        if (selectedVariable.references.length > 5) {
          message += `  ... and ${
            selectedVariable.references.length - 5
          } more references`;
        }
      } else {
        message += 'No references found';
      }

      vscode.window.showInformationMessage(message, { modal: true });
    }
  }

  /**
   * Gets statistics about variable usage
   * @param usageInfo The variable usage information
   * @returns Summary statistics
   */
  static getUsageStatistics(usageInfo: VariableUsageInfo[]): {
    totalVariables: number;
    unusedVariables: number;
    writeOnlyVariables: number;
    averageUsage: number;
    maxUsage: number;
    minUsage: number;
  } {
    const totalVariables = usageInfo.length;
    const unusedVariables = usageInfo.filter(v => v.isUnused).length;
    const writeOnlyVariables = usageInfo.filter(v => v.isWriteOnly).length;

    const usageCounts = usageInfo.map(v => v.usageCount);
    const averageUsage =
      usageCounts.length > 0
        ? usageCounts.reduce((sum, count) => sum + count, 0) /
          usageCounts.length
        : 0;
    const maxUsage = usageCounts.length > 0 ? Math.max(...usageCounts) : 0;
    const minUsage = usageCounts.length > 0 ? Math.min(...usageCounts) : 0;

    return {
      totalVariables,
      unusedVariables,
      writeOnlyVariables,
      averageUsage,
      maxUsage,
      minUsage,
    };
  }

  /**
   * Generates a usage report
   * @param usageInfo The variable usage information
   * @returns A formatted usage report
   */
  static generateUsageReport(usageInfo: VariableUsageInfo[]): string {
    const stats = this.getUsageStatistics(usageInfo);

    let report = 'Variable Usage Report\n';
    report += '====================\n\n';

    report += `Total Variables: ${stats.totalVariables}\n`;
    report += `Unused Variables: ${stats.unusedVariables}\n`;
    report += `Write-Only Variables: ${stats.writeOnlyVariables}\n`;
    report += `Average Usage Count: ${stats.averageUsage.toFixed(2)}\n`;
    report += `Max Usage Count: ${stats.maxUsage}\n`;
    report += `Min Usage Count: ${stats.minUsage}\n\n`;

    if (stats.unusedVariables > 0) {
      report += 'Unused Variables:\n';
      const unusedVars = usageInfo.filter(v => v.isUnused);
      for (const variable of unusedVars) {
        report += `  - ${variable.name} (${variable.declarationType}) at line ${variable.line}\n`;
      }
      report += '\n';
    }

    if (stats.writeOnlyVariables > 0) {
      report += 'Write-Only Variables:\n';
      const writeOnlyVars = usageInfo.filter(v => v.isWriteOnly);
      for (const variable of writeOnlyVars) {
        report += `  - ${variable.name} (${variable.declarationType}) at line ${variable.line}\n`;
      }
      report += '\n';
    }

    report += 'All Variables:\n';
    for (const variable of usageInfo) {
      const status = variable.isUnused
        ? 'UNUSED'
        : variable.isWriteOnly
        ? 'WRITE-ONLY'
        : `${variable.usageCount} uses`;
      report += `  - ${variable.name} (${variable.declarationType}): ${status}\n`;
    }

    return report;
  }
}
