"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossReferenceTracker = void 0;
class CrossReferenceTracker {
    /**
     * Tracks variable references across multiple documents
     * @param documents Array of text documents to analyze
     * @param variablesByFile Map of variables grouped by file
     * @returns A cross-reference map showing where each variable is used
     */
    static async trackCrossReferences(documents, variablesByFile) {
        const crossRefMap = {};
        // Initialize the map with all variables
        for (const [filePath, variables] of variablesByFile.entries()) {
            for (const variable of variables) {
                const fullName = `${filePath}::${variable.name}`;
                if (!crossRefMap[variable.name]) {
                    crossRefMap[variable.name] = {
                        variable: variable,
                        references: [],
                    };
                }
            }
        }
        // Track references across all documents
        for (const document of documents) {
            const documentText = document.getText();
            const fileName = document.fileName;
            // Check each variable against this document
            for (const [variableName, variableRef] of Object.entries(crossRefMap)) {
                const references = this.findVariableReferences(documentText, variableName);
                for (const ref of references) {
                    variableRef.references.push({
                        file: fileName,
                        line: ref.line,
                        character: ref.character,
                    });
                }
            }
        }
        return crossRefMap;
    }
    /**
     * Finds all references to a variable name in the document text
     * @param text The document text
     * @param variableName The name of the variable to find references for
     * @returns Array of positions where the variable is referenced
     */
    static findVariableReferences(text, variableName) {
        const references = [];
        const regex = new RegExp(`\\b${this.escapeRegExp(variableName)}\\b`, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            // Calculate line and character position
            const substr = text.substring(0, match.index);
            const lines = substr.split('\n');
            const line = lines.length;
            const character = lines[lines.length - 1].length + 1;
            references.push({ line, character });
        }
        return references;
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
     * Gets a formatted string representation of the cross-reference map
     * @param crossRefMap The cross-reference map to format
     * @returns A formatted string showing the cross-references
     */
    static formatCrossReferences(crossRefMap) {
        let result = 'Cross-Reference Analysis:\n\n';
        for (const [variableName, refInfo] of Object.entries(crossRefMap)) {
            result += `${variableName} (${refInfo.variable.kind}, ${refInfo.variable.type}):\n`;
            if (refInfo.references.length > 0) {
                for (const ref of refInfo.references) {
                    result += `  - ${ref.file}:${ref.line}:${ref.character}\n`;
                }
            }
            else {
                result += '  - No external references found\n';
            }
            result += '\n';
        }
        return result;
    }
    /**
     * Finds unused variables across the entire codebase
     * @param crossRefMap The cross-reference map to analyze
     * @returns Array of unused variables
     */
    static findUnusedVariables(crossRefMap) {
        const unusedVariables = [];
        for (const [variableName, refInfo] of Object.entries(crossRefMap)) {
            // A variable is considered unused if it only has one reference (its declaration)
            // or no references at all
            if (refInfo.references.length <= 1) {
                unusedVariables.push(refInfo.variable);
            }
        }
        return unusedVariables;
    }
    /**
     * Finds highly used variables (hotspots)
     * @param crossRefMap The cross-reference map to analyze
     * @param threshold The minimum number of references to be considered a hotspot
     * @returns Array of highly used variables
     */
    static findHotspotVariables(crossRefMap, threshold = 10) {
        const hotspotVariables = [];
        for (const [variableName, refInfo] of Object.entries(crossRefMap)) {
            // A variable is considered a hotspot if it has many references
            if (refInfo.references.length >= threshold) {
                hotspotVariables.push(refInfo.variable);
            }
        }
        return hotspotVariables;
    }
}
exports.CrossReferenceTracker = CrossReferenceTracker;
//# sourceMappingURL=crossReferenceTracker.js.map