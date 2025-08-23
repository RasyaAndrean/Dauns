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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncScanner = void 0;
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var variableScanner_1 = require("../variableScanner");
// Mock Worker class since Web Workers aren't available in Node.js
// In a real implementation, this would use actual Web Workers
var MockWorker = /** @class */ (function () {
    function MockWorker() {
        this.onmessage = null;
        this.onerror = null;
    }
    MockWorker.prototype.postMessage = function (message) {
        var _this = this;
        // Simulate worker processing
        setTimeout(function () {
            if (message.type === 'scan' && message.content) {
                try {
                    // Create a mock document for scanning
                    var mockDocument = {
                        getText: function () { return message.content; },
                        fileName: message.filePath || '',
                        lineAt: function (line) {
                            var _a;
                            return ({
                                text: ((_a = message.content) === null || _a === void 0 ? void 0 : _a.split('\n')[line]) || '',
                            });
                        },
                        positionAt: function (offset) {
                            var _a;
                            var lines = ((_a = message.content) === null || _a === void 0 ? void 0 : _a.substring(0, offset).split('\n')) || [];
                            return {
                                line: lines.length - 1,
                                character: lines[lines.length - 1].length,
                            };
                        },
                    };
                    var variables = (0, variableScanner_1.scanVariablesInDocument)(mockDocument);
                    if (_this.onmessage) {
                        _this.onmessage({
                            data: {
                                type: 'result',
                                filePath: message.filePath,
                                variables: variables,
                            },
                        });
                    }
                }
                catch (error) {
                    if (_this.onmessage) {
                        _this.onmessage({
                            data: {
                                type: 'error',
                                filePath: message.filePath,
                                error: error,
                            },
                        });
                    }
                }
            }
        }, 0);
    };
    MockWorker.prototype.terminate = function () {
        // Clean up worker resources
    };
    return MockWorker;
}());
var AsyncScanner = /** @class */ (function () {
    function AsyncScanner(maxWorkers) {
        this.workers = [];
        this.taskQueue = [];
        this.pendingTasks = new Map();
        this.maxWorkers = 4; // Adjust based on system capabilities
        if (maxWorkers) {
            this.maxWorkers = maxWorkers;
        }
        this.initializeWorkers();
    }
    AsyncScanner.prototype.initializeWorkers = function () {
        var _this = this;
        for (var i = 0; i < this.maxWorkers; i++) {
            var worker = new MockWorker();
            worker.onmessage = function (event) { return _this.handleWorkerMessage(event); };
            worker.onerror = function (event) { return _this.handleWorkerError(event); };
            this.workers.push(worker);
        }
    };
    AsyncScanner.prototype.scanWorkspaceAsync = function (workspacePath) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Get all files in the workspace
                        _this.getWorkspaceFiles(workspacePath)
                            .then(function (files) {
                            var results = new Map();
                            var completedTasks = 0;
                            var totalTasks = files.length;
                            if (totalTasks === 0) {
                                resolve(results);
                                return;
                            }
                            // Process files in chunks
                            files.forEach(function (filePath) {
                                _this.scanFileAsync(filePath)
                                    .then(function (variables) {
                                    results.set(filePath, variables);
                                    completedTasks++;
                                    if (completedTasks === totalTasks) {
                                        resolve(results);
                                    }
                                })
                                    .catch(function (error) {
                                    console.error("Error scanning file ".concat(filePath, ":"), error);
                                    completedTasks++;
                                    if (completedTasks === totalTasks) {
                                        resolve(results);
                                    }
                                });
                            });
                        })
                            .catch(reject);
                    })];
            });
        });
    };
    AsyncScanner.prototype.getWorkspaceFiles = function (workspacePath) {
        return __awaiter(this, void 0, void 0, function () {
            var files, skipDirs, walk;
            var _this = this;
            return __generator(this, function (_a) {
                files = [];
                skipDirs = ['node_modules', '.git', 'dist', 'build'];
                walk = function (dir) {
                    var entries = fs.readdirSync(dir, { withFileTypes: true });
                    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                        var entry = entries_1[_i];
                        var fullPath = path.join(dir, entry.name);
                        if (entry.isDirectory()) {
                            if (!skipDirs.includes(entry.name)) {
                                walk(fullPath);
                            }
                        }
                        else if (_this.isSupportedFile(entry.name)) {
                            files.push(fullPath);
                        }
                    }
                };
                try {
                    walk(workspacePath);
                    return [2 /*return*/, files];
                }
                catch (error) {
                    console.error('Error reading workspace files:', error);
                    return [2 /*return*/, []];
                }
                return [2 /*return*/];
            });
        });
    };
    AsyncScanner.prototype.isSupportedFile = function (fileName) {
        var supportedExtensions = [
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
        var ext = path.extname(fileName).toLowerCase();
        return supportedExtensions.includes(ext);
    };
    AsyncScanner.prototype.scanFileAsync = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        fs.readFile(filePath, 'utf8', function (err, content) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            try {
                                // Create a mock document for scanning
                                var mockDocument = {
                                    getText: function () { return content; },
                                    fileName: filePath,
                                    lineAt: function (line) { return ({
                                        text: content.split('\n')[line] || '',
                                    }); },
                                    positionAt: function (offset) {
                                        var lines = content.substring(0, offset).split('\n');
                                        return {
                                            line: lines.length - 1,
                                            character: lines[lines.length - 1].length,
                                        };
                                    },
                                };
                                var variables = (0, variableScanner_1.scanVariablesInDocument)(mockDocument);
                                resolve(variables);
                            }
                            catch (error) {
                                reject(error);
                            }
                        });
                    })];
            });
        });
    };
    AsyncScanner.prototype.handleWorkerMessage = function (event) {
        var message = event.data;
        switch (message.type) {
            case 'result':
                if (message.filePath && message.variables) {
                    var task = this.pendingTasks.get(message.filePath);
                    if (task) {
                        task.resolve(message.variables);
                        this.pendingTasks.delete(message.filePath);
                    }
                }
                break;
            case 'error':
                if (message.filePath) {
                    var task = this.pendingTasks.get(message.filePath);
                    if (task) {
                        task.reject(message.error);
                        this.pendingTasks.delete(message.filePath);
                    }
                }
                break;
        }
    };
    AsyncScanner.prototype.handleWorkerError = function (event) {
        console.error('Worker error:', event);
    };
    AsyncScanner.prototype.dispose = function () {
        this.workers.forEach(function (worker) { return worker.terminate(); });
        this.workers = [];
        this.taskQueue = [];
        this.pendingTasks.clear();
    };
    return AsyncScanner;
}());
exports.AsyncScanner = AsyncScanner;
