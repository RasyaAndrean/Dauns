import * as vscode from 'vscode';
import { VariableInfo } from '../parsers/types';

/**
 * Interface for variable journey events
 */
export interface VariableJourneyEvent {
  type: 'declaration' | 'assignment' | 'reference' | 'modification';
  line: number;
  character: number;
  value?: string;
  context: string;
}

/**
 * Interface for variable journey
 */
export interface VariableJourney {
  variableName: string;
  events: VariableJourneyEvent[];
  timeline: string;
}

/**
 * Variable Journey Tracker for tracing variable lifecycle
 */
export class VariableJourneyTracker {
  /**
   * Tracks the journey of a variable through its lifecycle
   * @param document The text document to analyze
   * @param variable The variable to track
   * @returns The journey of the variable
   */
  static trackVariableJourney(
    document: vscode.TextDocument,
    variable: VariableInfo
  ): VariableJourney {
    const text = document.getText();
    const lines = text.split('\n');

    const journey: VariableJourney = {
      variableName: variable.name,
      events: [],
      timeline: '',
    };

    // Add declaration event
    journey.events.push({
      type: 'declaration',
      line: variable.line,
      character: variable.character,
      value: variable.value,
      context: lines[variable.line - 1] || '',
    });

    // Find all assignments and references
    const assignmentRegex = new RegExp(`\\b${variable.name}\\s*=[^=]`, 'g');
    const referenceRegex = new RegExp(`\\b${variable.name}\\b`, 'g');

    let match;

    // Find assignments
    while ((match = assignmentRegex.exec(text)) !== null) {
      const position = document.positionAt(match.index);
      const lineText = lines[position.line] || '';

      // Skip the declaration line as we already added it
      if (position.line + 1 !== variable.line) {
        journey.events.push({
          type: 'assignment',
          line: position.line + 1,
          character: position.character,
          context: lineText,
        });
      }
    }

    // Find references (excluding assignments and declaration)
    const allReferences = [];
    while ((match = referenceRegex.exec(text)) !== null) {
      const position = document.positionAt(match.index);
      allReferences.push({
        line: position.line + 1,
        character: position.character,
      });
    }

    // Add references that are not assignments or declaration
    for (const ref of allReferences) {
      // Skip if it's the declaration line
      if (ref.line === variable.line) {
        continue;
      }

      // Check if this reference is already added as an assignment
      const isAssignment = journey.events.some(
        event =>
          event.type === 'assignment' &&
          event.line === ref.line &&
          event.character === ref.character
      );

      if (!isAssignment) {
        const lineText = lines[ref.line - 1] || '';
        journey.events.push({
          type: 'reference',
          line: ref.line,
          character: ref.character,
          context: lineText,
        });
      }
    }

    // Sort events by line number
    journey.events.sort((a, b) => a.line - b.line);

    // Generate timeline
    journey.timeline = this.generateTimeline(journey.events);

    return journey;
  }

  /**
   * Generates a timeline string from events
   * @param events The events to generate timeline from
   * @returns The timeline string
   */
  private static generateTimeline(events: VariableJourneyEvent[]): string {
    let timeline = '';

    for (const event of events) {
      let eventType = '';
      switch (event.type) {
        case 'declaration':
          eventType = 'Declared';
          break;
        case 'assignment':
          eventType = 'Assigned';
          break;
        case 'reference':
          eventType = 'Referenced';
          break;
        case 'modification':
          eventType = 'Modified';
          break;
      }

      timeline += `Line ${event.line}: ${eventType}\n`;
      if (event.context) {
        timeline += `  ${event.context.trim()}\n`;
      }
      if (event.value) {
        timeline += `  Value: ${event.value}\n`;
      }
      timeline += '\n';
    }

    return timeline;
  }

  /**
   * Shows variable journey in a webview panel
   * @param journey The journey to display
   */
  static async showJourneyPanel(journey: VariableJourney): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'variableJourney',
      `Journey of ${journey.variableName}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Variable Journey: ${journey.variableName}</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
          }
          h1, h2, h3 {
            color: var(--vscode-editorWidget-border);
            border-bottom: 1px solid var(--vscode-editorWidget-border);
            padding-bottom: 5px;
          }
          .event {
            margin: 15px 0;
            padding: 10px;
            background-color: var(--vscode-sideBar-background);
            border-radius: 5px;
            border-left: 4px solid var(--vscode-editorWidget-border);
          }
          .declaration { border-left-color: #4CAF50; }
          .assignment { border-left-color: #2196F3; }
          .reference { border-left-color: #FF9800; }
          .modification { border-left-color: #9C27B0; }
          .line-number {
            display: inline-block;
            width: 60px;
            font-weight: bold;
          }
          .event-type {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
          }
          .declaration-type { background-color: rgba(76, 175, 80, 0.2); }
          .assignment-type { background-color: rgba(33, 150, 243, 0.2); }
          .reference-type { background-color: rgba(255, 152, 0, 0.2); }
          .modification-type { background-color: rgba(156, 39, 176, 0.2); }
          .context {
            background-color: var(--vscode-textBlockQuote-background);
            padding: 8px;
            margin: 5px 0;
            border-radius: 3px;
            font-family: monospace;
            white-space: pre-wrap;
          }
          .timeline {
            background-color: var(--vscode-sideBar-background);
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <h1>Variable Journey: ${journey.variableName}</h1>

        <div class="timeline">
          <h2>Timeline</h2>
          <pre>${journey.timeline
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}</pre>
        </div>

        <h2>Events</h2>
        ${journey.events
          .map(event => {
            let eventTypeClass = '';
            let eventTypeLabel = '';
            switch (event.type) {
              case 'declaration':
                eventTypeClass = 'declaration';
                eventTypeLabel = 'DECLARATION';
                break;
              case 'assignment':
                eventTypeClass = 'assignment';
                eventTypeLabel = 'ASSIGNMENT';
                break;
              case 'reference':
                eventTypeClass = 'reference';
                eventTypeLabel = 'REFERENCE';
                break;
              case 'modification':
                eventTypeClass = 'modification';
                eventTypeLabel = 'MODIFICATION';
                break;
            }

            return `
            <div class="event ${eventTypeClass}">
              <div>
                <span class="line-number">Line ${event.line}:</span>
                <span class="event-type ${eventTypeClass}-type">${eventTypeLabel}</span>
              </div>
              ${
                event.context
                  ? `<div class="context">${event.context
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')}</div>`
                  : ''
              }
              ${
                event.value
                  ? `<div><strong>Value:</strong> ${event.value}</div>`
                  : ''
              }
            </div>
          `;
          })
          .join('')}
      </body>
      </html>
    `;
  }

  /**
   * Shows variable journey in a quick pick
   * @param journey The journey to display
   */
  static async showJourneyQuickPick(journey: VariableJourney): Promise<void> {
    const items = journey.events.map(event => {
      let description = '';
      switch (event.type) {
        case 'declaration':
          description = 'Declared';
          break;
        case 'assignment':
          description = 'Assigned';
          break;
        case 'reference':
          description = 'Referenced';
          break;
        case 'modification':
          description = 'Modified';
          break;
      }

      return {
        label: `${event.line}: ${description}`,
        description: event.context ? event.context.trim() : '',
        event: event,
      };
    });

    const selection = await vscode.window.showQuickPick(items, {
      placeHolder: `Journey of ${journey.variableName}`,
      matchOnDescription: true,
    });

    if (selection) {
      // Show detailed information about the selected event
      let message = `Event: ${selection.label}\n`;
      if (selection.event.context) {
        message += `Context: ${selection.event.context}\n`;
      }
      if (selection.event.value) {
        message += `Value: ${selection.event.value}\n`;
      }

      vscode.window.showInformationMessage(message, { modal: true });
    }
  }
}
