"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableLifecycleTracker = void 0;
class VariableLifecycleTracker {
    /**
     * Tracks the lifecycle of variables within a document
     * @param document The text document to analyze
     * @param variables The variables found in the document
     * @returns A lifecycle analysis of all variables
     */
    static trackLifecycle(document, variables) {
        const text = document.getText();
        const analysis = {};
        for (const variable of variables) {
            const events = [];
            // Add declaration event
            events.push({
                type: 'declaration',
                line: variable.line,
                character: variable.character,
            });
            // Find assignments and modifications
            const assignmentEvents = this.findAssignmentEvents(text, variable.name);
            events.push(...assignmentEvents);
            // Find usages
            const usageEvents = this.findUsageEvents(text, variable.name, variable.line);
            events.push(...usageEvents);
            // Sort events by line number
            events.sort((a, b) => a.line - b.line);
            // Determine scope
            const scope = this.determineScope(text, variable);
            analysis[variable.name] = {
                variable: variable,
                events: events,
                scope: scope,
            };
        }
        return analysis;
    }
    /**
     * Finds assignment events for a variable
     * @param text The document text
     * @param variableName The name of the variable
     * @returns Array of assignment events
     */
    static findAssignmentEvents(text, variableName) {
        const events = [];
        // Match variable assignments (variable = value)
        const assignmentRegex = new RegExp(`\\b${this.escapeRegExp(variableName)}\\s*=\\s*([^;\\n]+)`, 'g');
        let match;
        while ((match = assignmentRegex.exec(text)) !== null) {
            // Calculate line and character position
            const substr = text.substring(0, match.index);
            const lines = substr.split('\n');
            const line = lines.length;
            const character = lines[lines.length - 1].length + 1;
            events.push({
                type: 'assignment',
                line: line,
                character: character,
                value: match[1].trim(),
            });
        }
        return events;
    }
    /**
     * Finds usage events for a variable
     * @param text The document text
     * @param variableName The name of the variable
     * @param declarationLine The line where the variable was declared
     * @returns Array of usage events
     */
    static findUsageEvents(text, variableName, declarationLine) {
        const events = [];
        // Match variable usages (not declarations or assignments)
        const usageRegex = new RegExp(`\\b${this.escapeRegExp(variableName)}\\b`, 'g');
        let match;
        while ((match = usageRegex.exec(text)) !== null) {
            // Calculate line and character position
            const substr = text.substring(0, match.index);
            const lines = substr.split('\n');
            const line = lines.length;
            const character = lines[lines.length - 1].length + 1;
            // Skip if this is the declaration line (already added as declaration event)
            if (line !== declarationLine) {
                events.push({
                    type: 'usage',
                    line: line,
                    character: character,
                });
            }
        }
        return events;
    }
    /**
     * Determines the scope of a variable
     * @param text The document text
     * @param variable The variable to analyze
     * @returns The scope information
     */
    static determineScope(text, variable) {
        // For simplicity, we'll implement a basic scope detection
        // In a real implementation, this would use AST parsing
        // Check if it's a global variable (declared outside of any function)
        const functionRegex = /function\s+\w*\s*\([^)]*\)\s*\{/g;
        let functionMatch;
        let isGlobal = true;
        while ((functionMatch = functionRegex.exec(text)) !== null) {
            // Calculate line number of function start
            const substr = text.substring(0, functionMatch.index);
            const lines = substr.split('\n');
            const functionLine = lines.length;
            // Find function end (simple approach - find matching closing brace)
            let braceCount = 1;
            let i = functionMatch.index + functionMatch[0].length;
            let endLine = functionLine;
            while (braceCount > 0 && i < text.length) {
                if (text[i] === '{') {
                    braceCount++;
                }
                else if (text[i] === '}') {
                    braceCount--;
                }
                if (text[i] === '\n') {
                    endLine++;
                }
                i++;
            }
            // Check if variable is declared within this function
            if (variable.line >= functionLine && variable.line <= endLine) {
                isGlobal = false;
                break;
            }
        }
        if (isGlobal) {
            // Find document end for global scope
            const lines = text.split('\n');
            return {
                type: 'global',
                startLine: 1,
                endLine: lines.length,
            };
        }
        else {
            // Simplified function scope (in a real implementation, we would be more precise)
            return {
                type: 'function',
                startLine: variable.line - 5 > 0 ? variable.line - 5 : 1,
                endLine: variable.line + 20,
            };
        }
    }
    /**
     * Escapes special regex characters in a string
     * @param string The string to escape
     * @returns The escaped string
     */
    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Gets a formatted string representation of the lifecycle analysis
     * @param analysis The lifecycle analysis to format
     * @returns A formatted string showing the lifecycle information
     */
    static formatLifecycle(analysis) {
        let result = 'Variable Lifecycle Analysis:\n\n';
        for (const [variableName, lifecycle] of Object.entries(analysis)) {
            result += `${variableName} (${lifecycle.variable.kind}, ${lifecycle.variable.type}):\n`;
            result += `  Scope: ${lifecycle.scope.type} (lines ${lifecycle.scope.startLine}-${lifecycle.scope.endLine})\n`;
            result += `  Events:\n`;
            for (const event of lifecycle.events) {
                result += `    - ${event.type} at line ${event.line}`;
                if (event.value) {
                    result += ` (value: ${event.value})`;
                }
                result += '\n';
            }
            result += '\n';
        }
        return result;
    }
    /**
     * Finds variables with unusual lifecycle patterns
     * @param analysis The lifecycle analysis to examine
     * @returns Array of variables with unusual patterns
     */
    static findUnusualPatterns(analysis) {
        const unusualVariables = [];
        for (const [variableName, lifecycle] of Object.entries(analysis)) {
            // Check for variables that are declared but never used
            const usageEvents = lifecycle.events.filter(event => event.type === 'usage');
            if (usageEvents.length === 0) {
                unusualVariables.push(lifecycle.variable);
                continue;
            }
            // Check for variables that are modified but never read
            const assignmentEvents = lifecycle.events.filter(event => event.type === 'assignment');
            const declarationEvent = lifecycle.events.find(event => event.type === 'declaration');
            if (assignmentEvents.length > 0 &&
                usageEvents.length === 0 &&
                declarationEvent) {
                // If there are assignments but no usages (other than declaration), it might be unusual
                unusualVariables.push(lifecycle.variable);
            }
        }
        return unusualVariables;
    }
}
exports.VariableLifecycleTracker = VariableLifecycleTracker;
//# sourceMappingURL=variableLifecycle.js.map