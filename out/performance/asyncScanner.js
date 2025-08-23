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
exports.AsyncScanner = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const variableScanner_1 = require("../variableScanner");
// Mock Worker class since Web Workers aren't available in Node.js
// In a real implementation, this would use actual Web Workers
class MockWorker {
    constructor() {
        this.onmessage = null;
        this.onerror = null;
    }
    postMessage(message) {
        // Simulate worker processing
        setTimeout(() => {
            if (message.type === 'scan' && message.content) {
                try {
                    // Create a mock document for scanning
                    const mockDocument = {
                        getText: () => message.content,
                        fileName: message.filePath || '',
                        lineAt: (line) => ({
                            text: message.content?.split('\n')[line] || '',
                        }),
                        positionAt: (offset) => {
                            const lines = message.content?.substring(0, offset).split('\n') || [];
                            return {
                                line: lines.length - 1,
                                character: lines[lines.length - 1].length,
                            };
                        },
                    };
                    const variables = (0, variableScanner_1.scanVariablesInDocument)(mockDocument);
                    if (this.onmessage) {
                        this.onmessage({
                            data: {
                                type: 'result',
                                filePath: message.filePath,
                                variables,
                            },
                        });
                    }
                }
                catch (error) {
                    if (this.onmessage) {
                        this.onmessage({
                            data: {
                                type: 'error',
                                filePath: message.filePath,
                                error,
                            },
                        });
                    }
                }
            }
        }, 0);
    }
    terminate() {
        // Clean up worker resources
    }
}
class AsyncScanner {
    constructor(maxWorkers) {
        this.workers = [];
        this.taskQueue = [];
        this.pendingTasks = new Map();
        this.maxWorkers = 4; // Adjust based on system capabilities
        if (maxWorkers) {
            this.maxWorkers = maxWorkers;
        }
        this.initializeWorkers();
    }
    initializeWorkers() {
        for (let i = 0; i < this.maxWorkers; i++) {
            const worker = new MockWorker();
            worker.onmessage = event => this.handleWorkerMessage(event);
            worker.onerror = event => this.handleWorkerError(event);
            this.workers.push(worker);
        }
    }
    async scanWorkspaceAsync(workspacePath) {
        return new Promise((resolve, reject) => {
            // Get all files in the workspace
            this.getWorkspaceFiles(workspacePath)
                .then(files => {
                const results = new Map();
                let completedTasks = 0;
                const totalTasks = files.length;
                if (totalTasks === 0) {
                    resolve(results);
                    return;
                }
                // Process files in chunks
                files.forEach(filePath => {
                    this.scanFileAsync(filePath)
                        .then(variables => {
                        results.set(filePath, variables);
                        completedTasks++;
                        if (completedTasks === totalTasks) {
                            resolve(results);
                        }
                    })
                        .catch(error => {
                        console.error(`Error scanning file ${filePath}:`, error);
                        completedTasks++;
                        if (completedTasks === totalTasks) {
                            resolve(results);
                        }
                    });
                });
            })
                .catch(reject);
        });
    }
    async getWorkspaceFiles(workspacePath) {
        const files = [];
        const skipDirs = ['node_modules', '.git', 'dist', 'build'];
        const walk = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!skipDirs.includes(entry.name)) {
                        walk(fullPath);
                    }
                }
                else if (this.isSupportedFile(entry.name)) {
                    files.push(fullPath);
                }
            }
        };
        try {
            walk(workspacePath);
            return files;
        }
        catch (error) {
            console.error('Error reading workspace files:', error);
            return [];
        }
    }
    isSupportedFile(fileName) {
        const supportedExtensions = [
            '.js',
            '.ts',
            '.jsx',
            '.tsx',
            '.py',
            '.vue',
            '.json',
            '.yaml',
            '.yml',
        ];
        const ext = path.extname(fileName).toLowerCase();
        return supportedExtensions.includes(ext);
    }
    async scanFileAsync(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, content) => {
                if (err) {
                    reject(err);
                    return;
                }
                try {
                    // Create a mock document for scanning
                    const mockDocument = {
                        getText: () => content,
                        fileName: filePath,
                        lineAt: (line) => ({
                            text: content.split('\n')[line] || '',
                        }),
                        positionAt: (offset) => {
                            const lines = content.substring(0, offset).split('\n');
                            return {
                                line: lines.length - 1,
                                character: lines[lines.length - 1].length,
                            };
                        },
                    };
                    const variables = (0, variableScanner_1.scanVariablesInDocument)(mockDocument);
                    resolve(variables);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    handleWorkerMessage(event) {
        const message = event.data;
        switch (message.type) {
            case 'result':
                if (message.filePath && message.variables) {
                    const task = this.pendingTasks.get(message.filePath);
                    if (task) {
                        task.resolve(message.variables);
                        this.pendingTasks.delete(message.filePath);
                    }
                }
                break;
            case 'error':
                if (message.filePath) {
                    const task = this.pendingTasks.get(message.filePath);
                    if (task) {
                        task.reject(message.error);
                        this.pendingTasks.delete(message.filePath);
                    }
                }
                break;
        }
    }
    handleWorkerError(event) {
        console.error('Worker error:', event);
    }
    dispose() {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.taskQueue = [];
        this.pendingTasks.clear();
    }
}
exports.AsyncScanner = AsyncScanner;
//# sourceMappingURL=asyncScanner.js.map