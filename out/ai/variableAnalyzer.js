"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIVariableAnalyzer = void 0;
/**
 * AI-powered variable analyzer that provides intelligent suggestions
 * for variable naming, usage patterns, and potential issues.
 */
class AIVariableAnalyzer {
    /**
     * Analyzes a single variable and provides intelligent suggestions
     * @param variable The variable information to analyze
     * @param allVariables All variables in the current context
     * @returns Analysis results with suggestions
     */
    analyzeVariable(variable, allVariables) {
        const results = [];
        const allNames = allVariables.map(v => v.name);
        // Analyze naming convention
        const namingResult = this.analyzeNamingConvention(variable, allNames);
        if (namingResult) {
            results.push(namingResult);
        }
        // Analyze usage patterns
        const usageResult = this.analyzeUsagePattern(variable);
        if (usageResult) {
            results.push(usageResult);
        }
        // Analyze security concerns
        const securityResult = this.analyzeSecurityConcerns(variable);
        if (securityResult) {
            results.push(securityResult);
        }
        // Analyze scope and lifetime
        const scopeResult = this.analyzeScopeAndLifetime(variable, allVariables);
        if (scopeResult) {
            results.push(scopeResult);
        }
        return results;
    }
    /**
     * Analyzes the naming convention of a variable
     * @param variable The variable to analyze
     * @param allNames All variable names in the current context
     * @returns Naming analysis result
     */
    analyzeNamingConvention(variable, allNames) {
        const { name } = variable;
        const suggestions = [];
        let explanation = '';
        // Check for naming convention issues
        if (AIVariableAnalyzer.COMMON_ISSUES.tooShort(name)) {
            suggestions.push('Consider using a more descriptive name');
            explanation =
                'Variable name is too short and may not be descriptive enough.';
        }
        else if (AIVariableAnalyzer.COMMON_ISSUES.tooLong(name)) {
            suggestions.push('Consider using a shorter, more concise name');
            explanation =
                'Variable name is very long, which might make the code less readable.';
        }
        else if (AIVariableAnalyzer.COMMON_ISSUES.meaningless(name)) {
            suggestions.push('Consider using a more meaningful name that describes its purpose');
            explanation = 'Variable name lacks semantic meaning.';
        }
        else if (AIVariableAnalyzer.COMMON_ISSUES.similar(name, allNames)) {
            suggestions.push('This variable name is similar to others in the same scope, which might cause confusion');
            explanation =
                'Variable name is too similar to another variable in the same context.';
        }
        // Check if naming convention matches type
        if (variable.type === 'boolean' &&
            !AIVariableAnalyzer.NAMING_CONVENTIONS.boolean.test(name)) {
            suggestions.push(`Consider prefixing boolean variables with 'is', 'has', 'can', etc.`);
            explanation =
                'Boolean variables typically use a prefix like "is", "has", or "can".';
        }
        else if (variable.type === 'array' &&
            !AIVariableAnalyzer.NAMING_CONVENTIONS.array.test(name)) {
            suggestions.push('Consider using a plural form or suffix like "List" for array variables');
            explanation =
                'Array variables typically use plural forms or suffixes like "List" or "Array".';
        }
        else if (variable.declarationType === 'const' &&
            !AIVariableAnalyzer.NAMING_CONVENTIONS.constant.test(name)) {
            suggestions.push('Consider using UPPER_SNAKE_CASE for constant values');
            explanation = 'Constants typically use UPPER_SNAKE_CASE.';
        }
        if (suggestions.length === 0) {
            return null;
        }
        return {
            variableName: name,
            suggestions,
            confidence: 0.8,
            category: 'naming',
            explanation,
        };
    }
    /**
     * Analyzes the usage pattern of a variable
     * @param variable The variable to analyze
     * @returns Usage pattern analysis result
     */
    analyzeUsagePattern(variable) {
        const { name, references, declarationType } = variable;
        const suggestions = [];
        let explanation = '';
        // Check for unused variables
        if (references.length === 0) {
            suggestions.push('This variable is declared but never used');
            explanation = 'Variable is declared but never used in the code.';
        }
        // Check for variables that are only written to but never read
        else if (references.length === 1 && references[0].context.includes('=')) {
            suggestions.push('This variable is assigned a value but never read');
            explanation = 'Variable is assigned a value but never read afterwards.';
        }
        // Check if 'let' is used for variables that are never reassigned
        if (declarationType === 'let' &&
            references.every(ref => !ref.context.includes('='))) {
            suggestions.push('Consider using "const" since this variable is never reassigned');
            explanation =
                'Variable declared with "let" but never reassigned, consider using "const".';
        }
        if (suggestions.length === 0) {
            return null;
        }
        return {
            variableName: name,
            suggestions,
            confidence: 0.9,
            category: 'usage',
            explanation,
        };
    }
    /**
     * Analyzes potential security concerns with a variable
     * @param variable The variable to analyze
     * @returns Security analysis result
     */
    analyzeSecurityConcerns(variable) {
        const { name, references } = variable;
        const suggestions = [];
        let explanation = '';
        // Check for potentially sensitive information
        const sensitivePatterns = [
            'password',
            'passwd',
            'secret',
            'token',
            'key',
            'auth',
            'credential',
            'api',
            'private',
            'sensitive',
            'secure',
        ];
        if (sensitivePatterns.some(pattern => name.toLowerCase().includes(pattern))) {
            const referenceContexts = references.map(ref => ref.context);
            // Check if sensitive data is logged or exposed
            if (referenceContexts.some(ctx => ctx.includes('console.log') ||
                ctx.includes('alert(') ||
                ctx.includes('document.write'))) {
                suggestions.push('Avoid logging or exposing sensitive information');
                explanation =
                    'Sensitive data should not be logged or exposed to the client.';
            }
            // Check if sensitive data is stored unencrypted
            if (referenceContexts.some(ctx => ctx.includes('localStorage') || ctx.includes('sessionStorage'))) {
                suggestions.push('Consider encrypting sensitive data before storing in browser storage');
                explanation =
                    'Sensitive data should be encrypted before being stored in browser storage.';
            }
        }
        if (suggestions.length === 0) {
            return null;
        }
        return {
            variableName: name,
            suggestions,
            confidence: 0.7,
            category: 'security',
            explanation,
        };
    }
    /**
     * Analyzes the scope and lifetime of a variable
     * @param variable The variable to analyze
     * @param allVariables All variables in the current context
     * @returns Scope analysis result
     */
    analyzeScopeAndLifetime(variable, allVariables) {
        const { name, scope, references } = variable;
        const suggestions = [];
        let explanation = '';
        // Check for global variables with many references
        if (scope === 'global' && references.length > 5) {
            suggestions.push('Consider reducing the scope of this variable or breaking it into smaller, more focused variables');
            explanation =
                'Global variables with many references can lead to maintenance issues.';
        }
        // Check for variables with very limited usage
        if (scope !== 'global' && references.length === 1) {
            suggestions.push('This variable has limited usage. Consider inlining it or refactoring');
            explanation =
                'Variables with very limited usage could potentially be inlined.';
        }
        // Check for shadowing
        const shadowedVariables = allVariables.filter(v => v.name === name && v.filePath === variable.filePath && v !== variable);
        if (shadowedVariables.length > 0) {
            suggestions.push('This variable shadows another variable with the same name in an outer scope');
            explanation = 'Variable shadowing can lead to confusion and bugs.';
        }
        if (suggestions.length === 0) {
            return null;
        }
        return {
            variableName: name,
            suggestions,
            confidence: 0.85,
            category: 'general',
            explanation,
        };
    }
    /**
     * Calculates the overall quality score for a variable
     * @param variable The variable to analyze
     * @param allVariables All variables in the current context
     * @returns Quality score with detailed breakdown
     */
    calculateVariableQualityScore(variable, allVariables) {
        const allNames = allVariables.map(v => v.name);
        const analysisResults = this.analyzeVariable(variable, allVariables);
        // Calculate naming score (0-100)
        let namingScore = 100;
        if (AIVariableAnalyzer.COMMON_ISSUES.tooShort(variable.name)) {
            namingScore -= 30;
        }
        if (AIVariableAnalyzer.COMMON_ISSUES.tooLong(variable.name)) {
            namingScore -= 20;
        }
        if (AIVariableAnalyzer.COMMON_ISSUES.meaningless(variable.name)) {
            namingScore -= 50;
        }
        if (AIVariableAnalyzer.COMMON_ISSUES.similar(variable.name, allNames)) {
            namingScore -= 25;
        }
        // Type-specific naming conventions
        if (variable.type === 'boolean' &&
            !AIVariableAnalyzer.NAMING_CONVENTIONS.boolean.test(variable.name)) {
            namingScore -= 15;
        }
        if (variable.type === 'array' &&
            !AIVariableAnalyzer.NAMING_CONVENTIONS.array.test(variable.name)) {
            namingScore -= 15;
        }
        if (variable.declarationType === 'const' &&
            !AIVariableAnalyzer.NAMING_CONVENTIONS.constant.test(variable.name)) {
            namingScore -= 10;
        }
        // Calculate usage score (0-100)
        let usageScore = 100;
        if (variable.references.length === 0) {
            usageScore = 0;
        }
        else if (variable.references.length === 1 &&
            variable.references[0].context.includes('=')) {
            usageScore -= 50;
        }
        if (variable.declarationType === 'let' &&
            variable.references.every(ref => !ref.context.includes('='))) {
            usageScore -= 15;
        }
        // Calculate scope score (0-100)
        let scopeScore = 100;
        if (variable.scope === 'global' && variable.references.length > 5) {
            scopeScore -= 20;
        }
        if (variable.scope !== 'global' && variable.references.length === 1) {
            scopeScore -= 10;
        }
        const shadowedVariables = allVariables.filter(v => v.name === variable.name &&
            v.filePath === variable.filePath &&
            v !== variable);
        if (shadowedVariables.length > 0) {
            scopeScore -= 25;
        }
        // Ensure scores are within bounds
        namingScore = Math.max(0, Math.min(100, namingScore));
        usageScore = Math.max(0, Math.min(100, usageScore));
        scopeScore = Math.max(0, Math.min(100, scopeScore));
        // Calculate overall score (weighted average)
        const overallScore = Math.round(namingScore * 0.4 + usageScore * 0.4 + scopeScore * 0.2);
        // Compile suggestions
        const suggestions = analysisResults.flatMap(result => result.suggestions);
        return {
            name: variable.name,
            namingScore,
            usageScore,
            scopeScore,
            overallScore,
            suggestions,
        };
    }
}
exports.AIVariableAnalyzer = AIVariableAnalyzer;
AIVariableAnalyzer.NAMING_PATTERNS = {
    camelCase: /^[a-z][a-zA-Z0-9]*$/,
    pascalCase: /^[A-Z][a-zA-Z0-9]*$/,
    snake_case: /^[a-z][a-z0-9_]*$/,
    UPPER_SNAKE_CASE: /^[A-Z][A-Z0-9_]*$/,
    Hungarian: /^[a-z]{1,3}[A-Z][a-zA-Z0-9]*$/,
};
AIVariableAnalyzer.NAMING_CONVENTIONS = {
    boolean: /^(is|has|can|should|will|did)/i,
    array: /(s|List|Array|Collection)$/,
    constant: /^[A-Z][A-Z0-9_]*$/,
    private: /^_[a-z]/,
    temp: /^(temp|tmp)/i,
};
AIVariableAnalyzer.COMMON_ISSUES = {
    tooShort: (name) => name.length < 2 && !/^[ijk]$/.test(name), // Allow i,j,k for loop counters
    tooLong: (name) => name.length > 30,
    meaningless: (name) => /^(foo|bar|baz|x|y|z|a|b|c)$/.test(name) && !/^[ijk]$/.test(name),
    similar: (name, allNames) => allNames.some(other => other !== name &&
        (other.toLowerCase() === name.toLowerCase() ||
            levenshteinDistance(name, other) <= 2)),
};
/**
 * Calculate Levenshtein distance between two strings
 * (Used for finding similar variable names)
 */
function levenshteinDistance(a, b) {
    const matrix = [];
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, // deletion
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }
    return matrix[b.length][a.length];
}
//# sourceMappingURL=variableAnalyzer.js.map