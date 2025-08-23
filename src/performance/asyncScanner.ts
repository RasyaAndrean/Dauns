import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { scanVariablesInDocument } from '../variableScanner';

// Define types
interface ScanTask {
  filePath: string;
  resolve: (value: any[]) => void;
  reject: (reason: any) => void;
}

interface WorkerMessage {
  type: 'scan' | 'result' | 'error';
  filePath?: string;
  content?: string;
  variables?: any[];
  error?: any;
}

interface ErrorEvent {
  message: string;
  filename?: string;
  lineno?: number;
}

// Mock Worker class since Web Workers aren't available in Node.js
// In a real implementation, this would use actual Web Workers
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  postMessage(message: WorkerMessage): void {
    // Simulate worker processing
    setTimeout(() => {
      if (message.type === 'scan' && message.content) {
        try {
          // Create a mock document for scanning
          const mockDocument = {
            getText: () => message.content,
            fileName: message.filePath || '',
            lineAt: (line: number) => ({
              text: message.content?.split('\n')[line] || '',
            }),
            positionAt: (offset: number) => {
              const lines =
                message.content?.substring(0, offset).split('\n') || [];
              return {
                line: lines.length - 1,
                character: lines[lines.length - 1].length,
              } as vscode.Position;
            },
          } as unknown as vscode.TextDocument;

          const variables = scanVariablesInDocument(mockDocument);

          if (this.onmessage) {
            this.onmessage({
              data: {
                type: 'result',
                filePath: message.filePath,
                variables,
              },
            } as MessageEvent);
          }
        } catch (error) {
          if (this.onmessage) {
            this.onmessage({
              data: {
                type: 'error',
                filePath: message.filePath,
                error,
              },
            } as MessageEvent);
          }
        }
      }
    }, 0);
  }

  terminate(): void {
    // Clean up worker resources
  }
}

export class AsyncScanner {
  private workers: MockWorker[] = [];
  private taskQueue: ScanTask[] = [];
  private pendingTasks = new Map<string, ScanTask>();
  private maxWorkers = 4; // Adjust based on system capabilities

  constructor(maxWorkers?: number) {
    if (maxWorkers) {
      this.maxWorkers = maxWorkers;
    }
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new MockWorker();
      worker.onmessage = event => this.handleWorkerMessage(event);
      worker.onerror = event => this.handleWorkerError(event);
      this.workers.push(worker);
    }
  }

  async scanWorkspaceAsync(workspacePath: string): Promise<Map<string, any[]>> {
    return new Promise((resolve, reject) => {
      // Get all files in the workspace
      this.getWorkspaceFiles(workspacePath)
        .then(files => {
          const results = new Map<string, any[]>();
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

  private async getWorkspaceFiles(workspacePath: string): Promise<string[]> {
    const files: string[] = [];
    const skipDirs = ['node_modules', '.git', 'dist', 'build'];

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!skipDirs.includes(entry.name)) {
            walk(fullPath);
          }
        } else if (this.isSupportedFile(entry.name)) {
          files.push(fullPath);
        }
      }
    };

    try {
      walk(workspacePath);
      return files;
    } catch (error) {
      console.error('Error reading workspace files:', error);
      return [];
    }
  }

  private isSupportedFile(fileName: string): boolean {
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

  private async scanFileAsync(filePath: string): Promise<any[]> {
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
            lineAt: (line: number) => ({
              text: content.split('\n')[line] || '',
            }),
            positionAt: (offset: number) => {
              const lines = content.substring(0, offset).split('\n');
              return {
                line: lines.length - 1,
                character: lines[lines.length - 1].length,
              } as vscode.Position;
            },
          } as unknown as vscode.TextDocument;

          const variables = scanVariablesInDocument(mockDocument);
          resolve(variables);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const message: WorkerMessage = event.data;

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

  private handleWorkerError(event: ErrorEvent): void {
    console.error('Worker error:', event);
  }

  dispose(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.pendingTasks.clear();
  }
}
