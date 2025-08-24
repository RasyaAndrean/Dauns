"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamCollaborationManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
/**
 * Team collaboration module for sharing variable analysis results and comments
 */
class TeamCollaborationManager {
    constructor(context) {
        this.analyses = [];
        this.context = context;
        this.loadAnalyses();
    }
    /**
     * Creates a new team analysis
     * @param filePath Path to the analyzed file
     * @param variables Variables found in the file
     * @param qualityMetrics Optional code quality metrics
     * @param name Optional name for the analysis
     * @returns The created team analysis
     */
    createAnalysis(filePath, variables, qualityMetrics, name) {
        // Get author information
        const author = this.getAuthorInfo();
        // Generate ID
        const id = this.generateId();
        // Create name if not provided
        const analysisName = name ||
            `Analysis of ${path.basename(filePath)} - ${new Date().toLocaleDateString()}`;
        // Create analysis
        const analysis = {
            id,
            filePath,
            variables: this.sanitizeVariables(variables),
            qualityMetrics,
            comments: [],
            author,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            name: analysisName,
        };
        // Add to list and save
        this.analyses.push(analysis);
        this.saveAnalyses();
        return analysis;
    }
    /**
     * Adds a comment to a team analysis
     * @param analysisId ID of the analysis
     * @param variableName Name of the variable
     * @param comment Comment text
     * @returns The created comment or null if analysis not found
     */
    addComment(analysisId, variableName, comment) {
        const analysis = this.analyses.find(a => a.id === analysisId);
        if (!analysis) {
            return null;
        }
        // Get author information
        const author = this.getAuthorInfo();
        // Create comment
        const teamComment = {
            id: this.generateId(),
            variableName,
            filePath: analysis.filePath,
            comment,
            author,
            timestamp: Date.now(),
            resolved: false,
        };
        // Add to analysis
        analysis.comments.push(teamComment);
        analysis.updatedAt = Date.now();
        this.saveAnalyses();
        return teamComment;
    }
    /**
     * Resolves or unresolves a comment
     * @param analysisId ID of the analysis
     * @param commentId ID of the comment
     * @param resolved Whether the comment is resolved
     * @returns Whether the operation was successful
     */
    resolveComment(analysisId, commentId, resolved) {
        const analysis = this.analyses.find(a => a.id === analysisId);
        if (!analysis) {
            return false;
        }
        const comment = analysis.comments.find(c => c.id === commentId);
        if (!comment) {
            return false;
        }
        comment.resolved = resolved;
        analysis.updatedAt = Date.now();
        this.saveAnalyses();
        return true;
    }
    /**
     * Gets an analysis by ID
     * @param id ID of the analysis
     * @returns The analysis or null if not found
     */
    getAnalysis(id) {
        return this.analyses.find(a => a.id === id) || null;
    }
    /**
     * Gets all analyses
     * @returns List of all analyses
     */
    getAllAnalyses() {
        return [...this.analyses];
    }
    /**
     * Deletes an analysis
     * @param id ID of the analysis to delete
     * @returns Whether the operation was successful
     */
    deleteAnalysis(id) {
        const index = this.analyses.findIndex(a => a.id === id);
        if (index === -1) {
            return false;
        }
        this.analyses.splice(index, 1);
        this.saveAnalyses();
        return true;
    }
    /**
     * Exports an analysis to a file
     * @param analysisId ID of the analysis to export
     * @param outputPath Path to save the exported file
     * @param format Format of the exported file
     * @returns Whether the operation was successful
     */
    exportAnalysis(analysisId, outputPath, format) {
        const analysis = this.getAnalysis(analysisId);
        if (!analysis) {
            return false;
        }
        try {
            let content = '';
            switch (format) {
                case 'json':
                    content = JSON.stringify(analysis, null, 2);
                    break;
                case 'html':
                    content = this.generateHtmlExport(analysis);
                    break;
                case 'markdown':
                    content = this.generateMarkdownExport(analysis);
                    break;
                case 'csv':
                    content = this.generateCsvExport(analysis);
                    break;
            }
            fs.writeFileSync(outputPath, content, 'utf8');
            return true;
        }
        catch (error) {
            console.error('Error exporting analysis:', error);
            return false;
        }
    }
    /**
     * Imports an analysis from a file
     * @param inputPath Path to the file to import
     * @returns The imported analysis or null if import failed
     */
    importAnalysis(inputPath) {
        try {
            // Only support JSON imports for now
            if (!inputPath.toLowerCase().endsWith('.json')) {
                throw new Error('Only JSON import is supported');
            }
            const content = fs.readFileSync(inputPath, 'utf8');
            const analysis = JSON.parse(content);
            // Validate analysis
            if (!analysis.id ||
                !analysis.filePath ||
                !Array.isArray(analysis.variables)) {
                throw new Error('Invalid analysis format');
            }
            // Check if analysis already exists
            if (this.analyses.some(a => a.id === analysis.id)) {
                // Generate a new ID
                analysis.id = this.generateId();
            }
            // Update timestamp
            analysis.updatedAt = Date.now();
            // Add to list and save
            this.analyses.push(analysis);
            this.saveAnalyses();
            return analysis;
        }
        catch (error) {
            console.error('Error importing analysis:', error);
            return null;
        }
    }
    /**
     * Generates a unique ID
     * @returns A unique ID
     */
    generateId() {
        return (Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15));
    }
    /**
     * Gets author information from Git or VS Code settings
     * @returns Author name
     */
    getAuthorInfo() {
        try {
            // Try to get Git user name
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const gitConfig = vscode.workspace.getConfiguration('git');
                const userName = gitConfig.get('user.name');
                if (userName) {
                    return userName;
                }
            }
        }
        catch (error) {
            // Ignore error
        }
        // Fallback to generic name
        return 'DAUNS User';
    }
    /**
     * Sanitizes variables for export (remove circular references)
     * @param variables Variables to sanitize
     * @returns Sanitized variables
     */
    sanitizeVariables(variables) {
        return variables.map(v => ({
            ...v,
            // Clone to avoid reference issues
            references: [...v.references],
        }));
    }
    /**
     * Loads analyses from storage
     */
    loadAnalyses() {
        try {
            const storageFolder = this.getStorageFolderPath();
            const analysesFile = path.join(storageFolder, TeamCollaborationManager.ANALYSES_FILE);
            if (fs.existsSync(analysesFile)) {
                const content = fs.readFileSync(analysesFile, 'utf8');
                this.analyses = JSON.parse(content);
            }
            else {
                this.analyses = [];
            }
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error loading analyses:', error);
            this.analyses = [];
        }
    }
    /**
     * Saves analyses to storage
     */
    saveAnalyses() {
        try {
            const storageFolder = this.getStorageFolderPath();
            const analysesFile = path.join(storageFolder, TeamCollaborationManager.ANALYSES_FILE);
            if (!fs.existsSync(storageFolder)) {
                fs.mkdirSync(storageFolder, { recursive: true });
            }
            fs.writeFileSync(analysesFile, JSON.stringify(this.analyses, null, 2), 'utf8');
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error saving analyses:', error);
        }
    }
    /**
     * Gets the path to the storage folder
     * @returns Path to the storage folder
     */
    getStorageFolderPath() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder is open');
        }
        return path.join(workspaceFolders[0].uri.fsPath, TeamCollaborationManager.STORAGE_FOLDER);
    }
    /**
     * Generates HTML export content
     * @param analysis Analysis to export
     * @returns HTML content
     */
    generateHtmlExport(analysis) {
        const date = new Date(analysis.createdAt);
        const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        // Generate variables table rows
        const variablesHtml = analysis.variables
            .map(variable => `
      <tr>
        <td>${variable.name}</td>
        <td>${variable.type}</td>
        <td>${variable.declarationType}</td>
        <td>${variable.scope}</td>
        <td>${variable.line}:${variable.character}</td>
        <td>${variable.references.length}</td>
      </tr>
    `)
            .join('');
        // Generate comments list
        const commentsHtml = analysis.comments
            .map(comment => `
      <div class="comment ${comment.resolved ? 'resolved' : ''}">
        <div class="comment-header">
          <strong>${comment.variableName}</strong>
          <span class="comment-meta">by ${comment.author} on ${new Date(comment.timestamp).toLocaleString()}</span>
          ${comment.resolved
            ? '<span class="resolved-badge">Resolved</span>'
            : ''}
        </div>
        <div class="comment-body">${comment.comment}</div>
      </div>
    `)
            .join('');
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${analysis.name} - DAUNS Analysis</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; margin: 0; padding: 20px; }
          h1, h2, h3 { margin-top: 20px; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; text-align: left; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .comment { border: 1px solid #ddd; border-radius: 5px; padding: 10px; margin-bottom: 10px; }
          .comment.resolved { background-color: #f0fff0; }
          .comment-header { margin-bottom: 5px; }
          .comment-meta { font-size: 0.8em; color: #777; margin-left: 10px; }
          .resolved-badge { background-color: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px; font-size: 0.8em; float: right; }
          .file-info { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${analysis.name}</h1>

        <div class="file-info">
          <p><strong>File:</strong> ${analysis.filePath}</p>
          <p><strong>Created by:</strong> ${analysis.author} on ${dateString}</p>
        </div>

        <h2>Variables (${analysis.variables.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Declaration</th>
              <th>Scope</th>
              <th>Position</th>
              <th>References</th>
            </tr>
          </thead>
          <tbody>
            ${variablesHtml}
          </tbody>
        </table>

        <h2>Comments (${analysis.comments.length})</h2>
        ${commentsHtml || '<p>No comments yet.</p>'}

        <footer>
          <p>Generated by DAUNS Variable Detective - ${new Date().toLocaleString()}</p>
        </footer>
      </body>
      </html>
    `;
    }
    /**
     * Generates Markdown export content
     * @param analysis Analysis to export
     * @returns Markdown content
     */
    generateMarkdownExport(analysis) {
        const date = new Date(analysis.createdAt);
        const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        // Generate variables table
        let markdownContent = `# ${analysis.name}\n\n`;
        markdownContent += `**File:** ${analysis.filePath}  \n`;
        markdownContent += `**Created by:** ${analysis.author} on ${dateString}\n\n`;
        markdownContent += `## Variables (${analysis.variables.length})\n\n`;
        markdownContent += `| Name | Type | Declaration | Scope | Position | References |\n`;
        markdownContent += `| ---- | ---- | ----------- | ----- | -------- | ---------- |\n`;
        analysis.variables.forEach(variable => {
            markdownContent += `| ${variable.name} | ${variable.type} | ${variable.declarationType} | ${variable.scope} | ${variable.line}:${variable.character} | ${variable.references.length} |\n`;
        });
        markdownContent += `\n## Comments (${analysis.comments.length})\n\n`;
        if (analysis.comments.length === 0) {
            markdownContent += `No comments yet.\n\n`;
        }
        else {
            analysis.comments.forEach(comment => {
                const commentDate = new Date(comment.timestamp).toLocaleString();
                markdownContent += `### ${comment.variableName} ${comment.resolved ? '✓' : ''}\n\n`;
                markdownContent += `*By ${comment.author} on ${commentDate}*\n\n`;
                markdownContent += `${comment.comment}\n\n`;
                markdownContent += `---\n\n`;
            });
        }
        markdownContent += `*Generated by DAUNS Variable Detective - ${new Date().toLocaleString()}*`;
        return markdownContent;
    }
    /**
     * Generates CSV export content
     * @param analysis Analysis to export
     * @returns CSV content
     */
    generateCsvExport(analysis) {
        // Helper to escape CSV fields
        const escapeCSV = (field) => {
            if (typeof field === 'number') {
                return field.toString();
            }
            if (field === null || field === undefined) {
                return '';
            }
            return `"${field.replace(/"/g, '""')}"`;
        };
        // Generate header
        let csvContent = 'Name,Type,Declaration,Scope,Line,Character,References,Value\n';
        // Generate rows
        analysis.variables.forEach(variable => {
            const row = [
                escapeCSV(variable.name),
                escapeCSV(variable.type),
                escapeCSV(variable.declarationType),
                escapeCSV(variable.scope),
                escapeCSV(variable.line),
                escapeCSV(variable.character),
                escapeCSV(variable.references.length),
                escapeCSV(variable.value || ''),
            ];
            csvContent += row.join(',') + '\n';
        });
        return csvContent;
    }
}
exports.TeamCollaborationManager = TeamCollaborationManager;
TeamCollaborationManager.STORAGE_FOLDER = '.dauns';
TeamCollaborationManager.ANALYSES_FILE = 'team-analyses.json';
//# sourceMappingURL=teamCollaboration.js.map