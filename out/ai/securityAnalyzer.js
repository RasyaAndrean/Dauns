"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAnalyzer = exports.SecurityVulnerabilitySeverity = exports.SecurityVulnerabilityType = void 0;
// Security Vulnerability Type
var SecurityVulnerabilityType;
(function (SecurityVulnerabilityType) {
    SecurityVulnerabilityType["SENSITIVE_DATA_EXPOSURE"] = "Sensitive Data Exposure";
    SecurityVulnerabilityType["INSECURE_DIRECT_OBJECT_REFERENCE"] = "Insecure Direct Object Reference";
    SecurityVulnerabilityType["HARDCODED_CREDENTIALS"] = "Hardcoded Credentials";
    SecurityVulnerabilityType["UNSAFE_DESERIALIZATION"] = "Unsafe Deserialization";
    SecurityVulnerabilityType["UNSAFE_EVAL"] = "Unsafe Eval Usage";
    SecurityVulnerabilityType["PROTOTYPE_POLLUTION"] = "Prototype Pollution";
    SecurityVulnerabilityType["COMMAND_INJECTION"] = "Command Injection";
    SecurityVulnerabilityType["SQL_INJECTION"] = "SQL Injection";
})(SecurityVulnerabilityType || (exports.SecurityVulnerabilityType = SecurityVulnerabilityType = {}));
// Security Vulnerability Severity
var SecurityVulnerabilitySeverity;
(function (SecurityVulnerabilitySeverity) {
    SecurityVulnerabilitySeverity["LOW"] = "Low";
    SecurityVulnerabilitySeverity["MEDIUM"] = "Medium";
    SecurityVulnerabilitySeverity["HIGH"] = "High";
    SecurityVulnerabilitySeverity["CRITICAL"] = "Critical";
})(SecurityVulnerabilitySeverity || (exports.SecurityVulnerabilitySeverity = SecurityVulnerabilitySeverity = {}));
/**
 * Security analyzer for detecting potential security vulnerabilities in variable usage
 */
class SecurityAnalyzer {
    /**
     * Analyzes variables for potential security vulnerabilities
     * @param variables List of variables to analyze
     * @param fileContent Content of the file being analyzed
     * @returns List of detected security vulnerabilities
     */
    analyzeSecurityVulnerabilities(variables, fileContent) {
        const vulnerabilities = [];
        variables.forEach(variable => {
            // Check for sensitive data exposure
            this.checkSensitiveDataExposure(variable, fileContent, vulnerabilities);
            // Check for hardcoded credentials
            this.checkHardcodedCredentials(variable, fileContent, vulnerabilities);
            // Check for unsafe function usage
            this.checkUnsafeFunctions(variable, fileContent, vulnerabilities);
            // Check for command injection
            this.checkCommandInjection(variable, fileContent, vulnerabilities);
            // Check for SQL injection
            this.checkSqlInjection(variable, fileContent, vulnerabilities);
            // Check for prototype pollution
            this.checkPrototypePollution(variable, fileContent, vulnerabilities);
        });
        return vulnerabilities;
    }
    /**
     * Checks for sensitive data exposure vulnerabilities
     * @param variable Variable to check
     * @param fileContent File content for context
     * @param vulnerabilities List to add detected vulnerabilities to
     */
    checkSensitiveDataExposure(variable, fileContent, vulnerabilities) {
        // Check if variable name matches sensitive patterns
        const isSensitive = SecurityAnalyzer.SENSITIVE_PATTERNS.some(pattern => pattern.test(variable.name));
        if (isSensitive) {
            // Check if sensitive data is logged or exposed
            for (const ref of variable.references) {
                const refLine = this.getLineAtPosition(fileContent, ref.line);
                const isExposed = refLine.includes('console.log') ||
                    refLine.includes('alert(') ||
                    refLine.includes('document.write') ||
                    refLine.includes('localStorage') ||
                    refLine.includes('sessionStorage');
                if (isExposed) {
                    vulnerabilities.push({
                        type: SecurityVulnerabilityType.SENSITIVE_DATA_EXPOSURE,
                        severity: SecurityVulnerabilitySeverity.HIGH,
                        variableName: variable.name,
                        filePath: variable.filePath,
                        line: ref.line,
                        character: ref.character,
                        description: `Sensitive data in variable '${variable.name}' is potentially exposed through ${refLine.includes('console.log')
                            ? 'logging'
                            : refLine.includes('localStorage') ||
                                refLine.includes('sessionStorage')
                                ? 'browser storage'
                                : 'client-side output'}.`,
                        recommendation: 'Avoid exposing sensitive data through logs, browser storage, or client-side output. Consider using secure storage methods or encryption.',
                        code: refLine.trim(),
                        cwe: 'CWE-200',
                    });
                }
            }
        }
    }
    /**
     * Checks for hardcoded credentials vulnerabilities
     * @param variable Variable to check
     * @param fileContent File content for context
     * @param vulnerabilities List to add detected vulnerabilities to
     */
    checkHardcodedCredentials(variable, fileContent, vulnerabilities) {
        // Check if variable name matches credential patterns
        const isCredential = SecurityAnalyzer.SENSITIVE_PATTERNS.some(pattern => pattern.test(variable.name));
        if (isCredential && variable.value) {
            // Check if it appears to be a hardcoded credential
            const valueLength = variable.value.length;
            const isHardcoded = 
            // Value is a non-empty string, not a reference to process.env or config
            valueLength > 3 &&
                !variable.value.includes('process.env') &&
                !variable.value.includes('config.') &&
                !variable.value.includes('settings.');
            if (isHardcoded) {
                vulnerabilities.push({
                    type: SecurityVulnerabilityType.HARDCODED_CREDENTIALS,
                    severity: SecurityVulnerabilitySeverity.CRITICAL,
                    variableName: variable.name,
                    filePath: variable.filePath,
                    line: variable.line,
                    character: variable.character,
                    description: `Hardcoded credential detected in variable '${variable.name}'.`,
                    recommendation: 'Avoid hardcoding credentials in source code. Use environment variables, secure credential stores, or configuration files that are not checked into version control.',
                    code: `${variable.declarationType} ${variable.name} = ${variable.value.length > 20
                        ? variable.value.substring(0, 20) + '...'
                        : variable.value}`,
                    cwe: 'CWE-798',
                });
            }
        }
    }
    /**
     * Checks for unsafe function usage vulnerabilities
     * @param variable Variable to check
     * @param fileContent File content for context
     * @param vulnerabilities List to add detected vulnerabilities to
     */
    checkUnsafeFunctions(variable, fileContent, vulnerabilities) {
        for (const ref of variable.references) {
            const refLine = this.getLineAtPosition(fileContent, ref.line);
            // Check for unsafe function usage
            const unsafeFunction = SecurityAnalyzer.UNSAFE_FUNCTIONS.find(pattern => pattern.test(refLine));
            if (unsafeFunction) {
                let type = SecurityVulnerabilityType.UNSAFE_EVAL;
                let cwe = 'CWE-95';
                // Determine the specific type of vulnerability
                if (/dangerouslySetInnerHTML|innerHTML/.test(unsafeFunction.source)) {
                    type = SecurityVulnerabilityType.UNSAFE_DESERIALIZATION;
                    cwe = 'CWE-502';
                }
                vulnerabilities.push({
                    type,
                    severity: SecurityVulnerabilitySeverity.HIGH,
                    variableName: variable.name,
                    filePath: variable.filePath,
                    line: ref.line,
                    character: ref.character,
                    description: `Potential unsafe code execution detected with variable '${variable.name}'`,
                    recommendation: 'Avoid using eval(), dynamic Function creation, or setting HTML content with user-provided data. Use safer alternatives like JSON.parse() or DOM manipulation methods.',
                    code: refLine.trim(),
                    cwe,
                });
            }
        }
    }
    /**
     * Checks for command injection vulnerabilities
     * @param variable Variable to check
     * @param fileContent File content for context
     * @param vulnerabilities List to add detected vulnerabilities to
     */
    checkCommandInjection(variable, fileContent, vulnerabilities) {
        for (const ref of variable.references) {
            const refLine = this.getLineAtPosition(fileContent, ref.line);
            // Check for command injection patterns
            const commandInjectionPattern = SecurityAnalyzer.COMMAND_INJECTION_PATTERNS.find(pattern => pattern.test(refLine));
            // Check if the variable is used in a potential command injection context
            if (commandInjectionPattern && refLine.includes(variable.name)) {
                vulnerabilities.push({
                    type: SecurityVulnerabilityType.COMMAND_INJECTION,
                    severity: SecurityVulnerabilitySeverity.CRITICAL,
                    variableName: variable.name,
                    filePath: variable.filePath,
                    line: ref.line,
                    character: ref.character,
                    description: `Potential command injection detected with variable '${variable.name}' in command execution.`,
                    recommendation: 'Avoid passing user-provided data to system commands. If necessary, validate and sanitize input rigorously, use allowlists for permitted values, and avoid shell execution when possible.',
                    code: refLine.trim(),
                    cwe: 'CWE-78',
                });
            }
        }
    }
    /**
     * Checks for SQL injection vulnerabilities
     * @param variable Variable to check
     * @param fileContent File content for context
     * @param vulnerabilities List to add detected vulnerabilities to
     */
    checkSqlInjection(variable, fileContent, vulnerabilities) {
        for (const ref of variable.references) {
            const refLine = this.getLineAtPosition(fileContent, ref.line);
            // Check for SQL injection patterns
            const sqlInjectionPattern = SecurityAnalyzer.SQL_INJECTION_PATTERNS.find(pattern => pattern.test(refLine));
            // Check if the variable is used in a potential SQL injection context
            if (sqlInjectionPattern &&
                refLine.includes(variable.name) &&
                !refLine.includes('?') &&
                !refLine.includes('prepared')) {
                vulnerabilities.push({
                    type: SecurityVulnerabilityType.SQL_INJECTION,
                    severity: SecurityVulnerabilitySeverity.CRITICAL,
                    variableName: variable.name,
                    filePath: variable.filePath,
                    line: ref.line,
                    character: ref.character,
                    description: `Potential SQL injection detected with variable '${variable.name}' in SQL operation.`,
                    recommendation: 'Use parameterized queries or prepared statements instead of string concatenation. Never trust user input when constructing SQL queries.',
                    code: refLine.trim(),
                    cwe: 'CWE-89',
                });
            }
        }
    }
    /**
     * Checks for prototype pollution vulnerabilities
     * @param variable Variable to check
     * @param fileContent File content for context
     * @param vulnerabilities List to add detected vulnerabilities to
     */
    checkPrototypePollution(variable, fileContent, vulnerabilities) {
        if (variable.type === 'object') {
            for (const ref of variable.references) {
                const refLine = this.getLineAtPosition(fileContent, ref.line);
                // Check for potential prototype pollution
                if ((refLine.includes('Object.assign') ||
                    refLine.includes('Object.setPrototypeOf') ||
                    refLine.includes('__proto__') ||
                    refLine.includes('prototype')) &&
                    refLine.includes(variable.name)) {
                    vulnerabilities.push({
                        type: SecurityVulnerabilityType.PROTOTYPE_POLLUTION,
                        severity: SecurityVulnerabilitySeverity.MEDIUM,
                        variableName: variable.name,
                        filePath: variable.filePath,
                        line: ref.line,
                        character: ref.character,
                        description: `Potential prototype pollution vulnerability detected with variable '${variable.name}'.`,
                        recommendation: 'Avoid modifying object prototypes with user input. Use Object.create(null) to create objects without prototypes, or use Map/Set instead of plain objects for user-controllable keys.',
                        code: refLine.trim(),
                        cwe: 'CWE-915',
                    });
                }
            }
        }
    }
    /**
     * Gets the line at the specified line number in the file content
     * @param content File content
     * @param lineNumber Line number (0-based)
     * @returns The line at the specified position
     */
    getLineAtPosition(content, lineNumber) {
        const lines = content.split('\n');
        return lineNumber < lines.length ? lines[lineNumber] : '';
    }
    /**
     * Generates a security report in HTML format
     * @param vulnerabilities List of detected vulnerabilities
     * @returns HTML content for the security report
     */
    generateSecurityReport(vulnerabilities) {
        // Count vulnerabilities by severity
        const severityCounts = {
            [SecurityVulnerabilitySeverity.CRITICAL]: 0,
            [SecurityVulnerabilitySeverity.HIGH]: 0,
            [SecurityVulnerabilitySeverity.MEDIUM]: 0,
            [SecurityVulnerabilitySeverity.LOW]: 0,
        };
        vulnerabilities.forEach(vuln => {
            severityCounts[vuln.severity]++;
        });
        // Count vulnerabilities by type
        const typeCounts = {};
        vulnerabilities.forEach(vuln => {
            typeCounts[vuln.type] = (typeCounts[vuln.type] || 0) + 1;
        });
        // Generate vulnerability table rows
        const vulnerabilityRows = vulnerabilities
            .map(vuln => {
            const severityColor = vuln.severity === SecurityVulnerabilitySeverity.CRITICAL
                ? '#d93737'
                : vuln.severity === SecurityVulnerabilitySeverity.HIGH
                    ? '#e95f2b'
                    : vuln.severity === SecurityVulnerabilitySeverity.MEDIUM
                        ? '#f2c037'
                        : '#6bc77f';
            return `
        <tr>
          <td><span class="severity-badge" style="background-color: ${severityColor}">${vuln.severity}</span></td>
          <td>${vuln.type}</td>
          <td>${vuln.variableName}</td>
          <td>${vuln.filePath.split('/').pop()}:${vuln.line + 1}</td>
          <td>
            <div class="code-block"><code>${this.escapeHtml(vuln.code)}</code></div>
            <div class="vuln-description">${vuln.description}</div>
            <div class="vuln-recommendation"><strong>Recommendation:</strong> ${vuln.recommendation}</div>
            ${vuln.cwe
                ? `<div class="vuln-cwe"><strong>CWE:</strong> <a href="https://cwe.mitre.org/data/definitions/${vuln.cwe.replace('CWE-', '')}.html" target="_blank">${vuln.cwe}</a></div>`
                : ''}
          </td>
        </tr>
      `;
        })
            .join('');
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Analysis Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          h1, h2, h3 {
            color: #2c3e50;
          }
          .summary-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .summary-box {
            background-color: #f9f9f9;
            border-radius: 5px;
            padding: 15px;
            width: 48%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .severity-count {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
          }
          .severity-item {
            text-align: center;
            padding: 10px;
          }
          .severity-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            color: white;
            font-weight: bold;
            font-size: 0.9em;
          }
          .vuln-count {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
          }
          th {
            background-color: #f2f2f2;
            text-align: left;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #f1f1f1;
          }
          .code-block {
            background-color: #f5f5f5;
            padding: 8px;
            border-radius: 3px;
            overflow-x: auto;
            margin-bottom: 8px;
          }
          code {
            font-family: 'Courier New', Courier, monospace;
          }
          .vuln-description {
            margin-bottom: 8px;
          }
          .vuln-recommendation {
            color: #2980b9;
            margin-bottom: 5px;
          }
          .vuln-cwe {
            font-size: 0.9em;
            color: #7f8c8d;
          }
          .chart-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .chart {
            width: 48%;
            height: 300px;
            background-color: #f9f9f9;
            border-radius: 5px;
            padding: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 0.9em;
            color: #7f8c8d;
          }
        </style>
      </head>
      <body>
        <h1>Security Analysis Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>

        <div class="summary-container">
          <div class="summary-box">
            <h2>Vulnerability Summary</h2>
            <p>A total of <strong>${vulnerabilities.length}</strong> potential security vulnerabilities were detected.</p>

            <div class="severity-count">
              <div class="severity-item">
                <span class="severity-badge" style="background-color: #d93737">Critical</span>
                <div class="vuln-count">${severityCounts[SecurityVulnerabilitySeverity.CRITICAL]}</div>
              </div>
              <div class="severity-item">
                <span class="severity-badge" style="background-color: #e95f2b">High</span>
                <div class="vuln-count">${severityCounts[SecurityVulnerabilitySeverity.HIGH]}</div>
              </div>
              <div class="severity-item">
                <span class="severity-badge" style="background-color: #f2c037">Medium</span>
                <div class="vuln-count">${severityCounts[SecurityVulnerabilitySeverity.MEDIUM]}</div>
              </div>
              <div class="severity-item">
                <span class="severity-badge" style="background-color: #6bc77f">Low</span>
                <div class="vuln-count">${severityCounts[SecurityVulnerabilitySeverity.LOW]}</div>
              </div>
            </div>
          </div>

          <div class="summary-box">
            <h2>Top Vulnerability Types</h2>
            <ul>
              ${Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => `<li><strong>${type}:</strong> ${count}</li>`)
            .join('')}
            </ul>
          </div>
        </div>

        ${vulnerabilities.length > 0
            ? `
          <h2>Detailed Findings</h2>
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Type</th>
                <th>Variable</th>
                <th>Location</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${vulnerabilityRows}
            </tbody>
          </table>
        `
            : '<p>No security vulnerabilities were detected.</p>'}

        <div class="footer">
          <p>This report was generated by DAUNS Security Analyzer. The findings represent potential security issues and should be reviewed by security professionals.</p>
        </div>
      </body>
      </html>
    `;
    }
    /**
     * Escapes HTML special characters
     * @param html HTML string to escape
     * @returns Escaped HTML string
     */
    escapeHtml(html) {
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
exports.SecurityAnalyzer = SecurityAnalyzer;
// Patterns for sensitive data in variable names
SecurityAnalyzer.SENSITIVE_PATTERNS = [
    /password/i,
    /passwd/i,
    /secret/i,
    /token/i,
    /key/i,
    /credential/i,
    /auth/i,
    /api.?key/i,
    /private/i,
    /jwt/i,
    /session/i,
    /ssn/i,
    /social.?security/i,
    /credit.?card/i,
    /card.?number/i,
    /cvv/i,
    /access.?token/i,
    /refresh.?token/i,
];
// Patterns for unsafe function calls
SecurityAnalyzer.UNSAFE_FUNCTIONS = [
    /eval\s*\(/i,
    /setTimeout\s*\(\s*['"`]/,
    /setInterval\s*\(\s*['"`]/,
    /Function\s*\(\s*['"`]/,
    /new\s+Function\s*\(\s*['"`]/,
    /document\.write/i,
    /\$\s*\(\s*['"`][^'"`]*\$\{/i,
    /exec\s*\(/i,
    /spawn\s*\(/i,
    /shell\.exec/i,
    /dangerouslySetInnerHTML/i,
    /innerHTML\s*=/,
    /sql\.query\s*\(/i,
    /\.raw\s*\(/i,
    /\.execute\s*\(/i,
];
// Patterns for potential command injection
SecurityAnalyzer.COMMAND_INJECTION_PATTERNS = [
    /child_process/i,
    /execSync/i,
    /spawnSync/i,
    /execFile/i,
    /fork/i,
    /system\s*\(/i,
    /popen\s*\(/i,
    /subprocess/i,
    /shell\.exec/i,
];
// Patterns for potential SQL injection
SecurityAnalyzer.SQL_INJECTION_PATTERNS = [
    /select\s+.*\s+from/i,
    /insert\s+into/i,
    /update\s+.*\s+set/i,
    /delete\s+from/i,
    /drop\s+table/i,
    /alter\s+table/i,
    /sql\.query/i,
    /\.raw\s*\(/i,
    /\.query\s*\(/i,
    /\.execute\s*\(/i,
];
//# sourceMappingURL=securityAnalyzer.js.map