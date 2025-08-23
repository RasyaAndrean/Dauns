"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyAnalyzer = void 0;
class DependencyAnalyzer {
    /**
     * Analyzes variable dependencies within a single document
     * @param document The text document to analyze
     * @param variables The variables found in the document
     * @returns A dependency graph showing relationships between variables
     */
    static analyzeDependencies(document, variables) {
        const text = document.getText();
        const graph = {};
        // Initialize the graph with all variables
        for (const variable of variables) {
            graph[variable.name] = {
                variable: variable,
                dependencies: [],
                dependents: [],
            };
        }
        // Analyze each variable's dependencies
        for (const variable of variables) {
            const variableRefs = this.findVariableReferences(text, variable.name);
            // Find which other variables are referenced in this variable's declaration/usage
            for (const ref of variableRefs) {
                // Check if the reference is within another variable's declaration
                for (const otherVariable of variables) {
                    if (otherVariable.name !== variable.name) {
                        // Check if this variable is used in the other variable's declaration
                        if (this.isVariableInDeclaration(text, otherVariable, variable.name)) {
                            // Add dependency: otherVariable depends on variable
                            if (!graph[otherVariable.name].dependencies.includes(variable.name)) {
                                graph[otherVariable.name].dependencies.push(variable.name);
                            }
                            if (!graph[variable.name].dependents.includes(otherVariable.name)) {
                                graph[variable.name].dependents.push(otherVariable.name);
                            }
                        }
                    }
                }
            }
        }
        return graph;
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
     * Checks if a variable is referenced in another variable's declaration
     * @param text The document text
     * @param variable The variable whose declaration we're checking
     * @param referenceName The name of the variable we're looking for
     * @returns True if referenceName is found in variable's declaration
     */
    static isVariableInDeclaration(text, variable, referenceName) {
        // Find the variable's declaration in the text
        const varRegex = new RegExp(`\\b(${variable.kind})\\s+${this.escapeRegExp(variable.name)}\\b`);
        const varMatch = varRegex.exec(text);
        if (!varMatch) {
            return false;
        }
        // Find the end of the declaration (semicolon, newline, or end of file)
        const declStart = varMatch.index;
        const semicolonIndex = text.indexOf(';', declStart);
        const newlineIndex = text.indexOf('\n', declStart);
        let declEnd;
        if (semicolonIndex !== -1 && newlineIndex !== -1) {
            declEnd = Math.min(semicolonIndex, newlineIndex);
        }
        else if (semicolonIndex !== -1) {
            declEnd = semicolonIndex;
        }
        else if (newlineIndex !== -1) {
            declEnd = newlineIndex;
        }
        else {
            declEnd = text.length;
        }
        // Extract the declaration text
        const declText = text.substring(declStart, declEnd);
        // Check if the reference name appears in this declaration
        const refRegex = new RegExp(`\\b${this.escapeRegExp(referenceName)}\\b`);
        return refRegex.test(declText);
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
     * Gets a formatted string representation of the dependency graph
     * @param graph The dependency graph to format
     * @returns A formatted string showing the dependencies
     */
    static formatDependencyGraph(graph) {
        let result = 'Variable Dependencies:\n\n';
        for (const [variableName, dependencyInfo] of Object.entries(graph)) {
            result += `${variableName} (${dependencyInfo.variable.kind}, ${dependencyInfo.variable.type}):\n`;
            if (dependencyInfo.dependencies.length > 0) {
                result += `  Depends on: ${dependencyInfo.dependencies.join(', ')}\n`;
            }
            if (dependencyInfo.dependents.length > 0) {
                result += `  Used by: ${dependencyInfo.dependents.join(', ')}\n`;
            }
            if (dependencyInfo.dependencies.length === 0 &&
                dependencyInfo.dependents.length === 0) {
                result += '  No dependencies or dependents\n';
            }
            result += '\n';
        }
        return result;
    }
    /**
     * Finds circular dependencies in the graph
     * @param graph The dependency graph to analyze
     * @returns Array of circular dependency chains
     */
    static findCircularDependencies(graph) {
        const circularDeps = [];
        const visited = new Set();
        const recursionStack = [];
        const dfs = (variableName) => {
            if (!visited.has(variableName)) {
                visited.add(variableName);
                recursionStack.push(variableName);
                // Visit all dependencies
                for (const dep of graph[variableName].dependencies) {
                    if (!visited.has(dep)) {
                        dfs(dep);
                    }
                    else if (recursionStack.includes(dep)) {
                        // Found a circular dependency
                        const cycleStartIndex = recursionStack.indexOf(dep);
                        const cycle = recursionStack.slice(cycleStartIndex);
                        cycle.push(dep); // Complete the cycle
                        circularDeps.push(cycle);
                    }
                }
            }
            recursionStack.pop();
        };
        // Run DFS on all variables
        for (const variableName in graph) {
            if (!visited.has(variableName)) {
                dfs(variableName);
            }
        }
        return circularDeps;
    }
}
exports.DependencyAnalyzer = DependencyAnalyzer;
//# sourceMappingURL=dependencyAnalyzer.js.map