import * as vscode from 'vscode';
import { scanVariablesInDocument } from '../variableScanner';

export class VariableHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return undefined;

    const word = document.getText(wordRange);
    const variables = scanVariablesInDocument(document);
    const variable: any = variables.find((v: any) => v.name === word);

    if (!variable) return undefined;

    const hoverContent = this.createHoverContent(variable);
    return new vscode.Hover(hoverContent, wordRange);
  }

  private createHoverContent(variable: any): vscode.MarkdownString {
    const content = new vscode.MarkdownString();
    content.isTrusted = true;

    // Variable header
    content.appendMarkdown(`**${variable.name}** \`${variable.type}\`\n\n`);

    // Declaration info
    content.appendMarkdown(`*Declared as:* \`${variable.kind}\`\n\n`);

    // Location information
    content.appendMarkdown(
      `*Location:* Line ${variable.line}, Column ${variable.character}\n\n`
    );

    // Quick actions
    content.appendMarkdown(
      `[Rename](command:dauns.renameVariable?${encodeURIComponent(
        JSON.stringify({ name: variable.name })
      )}) | ` +
        `[Find References](command:dauns.findReferences?${encodeURIComponent(
          JSON.stringify({ name: variable.name })
        )}) | ` +
        `[Extract Variable](command:dauns.extractVariable)`
    );

    return content;
  }
}
