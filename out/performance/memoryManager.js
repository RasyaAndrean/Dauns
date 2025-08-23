"use strict";
// Note: Memory management in Node.js/VS Code extensions is limited
// This implementation provides monitoring and cleanup utilities
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
exports.MemoryManager = void 0;
const vscode = __importStar(require("vscode"));
class MemoryManager {
    constructor() {
        this.memoryThresholds = {
            warning: 100, // 100MB
            critical: 200, // 200MB
        };
        this.monitoringInterval = null;
        this.cleanupCallbacks = [];
        this.memoryUsageHistory = [];
        this.historyLimit = 100;
    }
    monitorMemoryUsage() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.monitoringInterval = setInterval(() => {
            const currentUsage = this.getCurrentMemoryUsage();
            // Store usage history
            this.memoryUsageHistory.push(currentUsage);
            if (this.memoryUsageHistory.length > this.historyLimit) {
                this.memoryUsageHistory.shift();
            }
            // Check thresholds
            const usageMB = currentUsage.heapUsed / (1024 * 1024);
            if (usageMB > this.memoryThresholds.critical) {
                console.warn(`Critical memory usage: ${usageMB.toFixed(2)}MB`);
                this.performCriticalCleanup();
            }
            else if (usageMB > this.memoryThresholds.warning) {
                console.warn(`High memory usage: ${usageMB.toFixed(2)}MB`);
                this.performCleanup();
            }
        }, 30000); // Check every 30 seconds
    }
    getCurrentMemoryUsage() {
        return process.memoryUsage();
    }
    getMemoryUsageHistory() {
        return [...this.memoryUsageHistory];
    }
    getAverageMemoryUsage() {
        if (this.memoryUsageHistory.length === 0) {
            return this.getCurrentMemoryUsage();
        }
        const sum = this.memoryUsageHistory.reduce((acc, curr) => ({
            heapUsed: acc.heapUsed + curr.heapUsed,
            heapTotal: acc.heapTotal + curr.heapTotal,
            external: acc.external + curr.external,
            arrayBuffers: acc.arrayBuffers + curr.arrayBuffers,
        }), { heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 });
        const count = this.memoryUsageHistory.length;
        return {
            heapUsed: sum.heapUsed / count,
            heapTotal: sum.heapTotal / count,
            external: sum.external / count,
            arrayBuffers: sum.arrayBuffers / count,
        };
    }
    setMemoryThresholds(warning, critical) {
        this.memoryThresholds = { warning, critical };
    }
    registerCleanupCallback(callback) {
        this.cleanupCallbacks.push(callback);
    }
    unregisterCleanupCallback(callback) {
        const index = this.cleanupCallbacks.indexOf(callback);
        if (index > -1) {
            this.cleanupCallbacks.splice(index, 1);
        }
    }
    performCleanup() {
        console.log('Performing memory cleanup...');
        // Execute registered cleanup callbacks
        for (const callback of this.cleanupCallbacks) {
            try {
                callback();
            }
            catch (error) {
                console.error('Error during cleanup callback:', error);
            }
        }
        // Suggest garbage collection (only works with --expose-gc flag)
        if (global.gc) {
            global.gc();
        }
    }
    performCriticalCleanup() {
        console.log('Performing critical memory cleanup...');
        // Execute all cleanup callbacks
        for (const callback of this.cleanupCallbacks) {
            try {
                callback();
            }
            catch (error) {
                console.error('Error during critical cleanup callback:', error);
            }
        }
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        // Show warning to user
        vscode.window.showWarningMessage('DAUNS extension is using high memory. Consider restarting VS Code if performance degrades.');
    }
    getMemoryPressure() {
        const usage = this.getCurrentMemoryUsage();
        const usageMB = usage.heapUsed / (1024 * 1024);
        if (usageMB > this.memoryThresholds.critical) {
            return 'critical';
        }
        else if (usageMB > this.memoryThresholds.warning) {
            return 'high';
        }
        else if (usageMB > this.memoryThresholds.warning * 0.7) {
            return 'medium';
        }
        else {
            return 'low';
        }
    }
    dispose() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.cleanupCallbacks = [];
        this.memoryUsageHistory = [];
    }
}
exports.MemoryManager = MemoryManager;
//# sourceMappingURL=memoryManager.js.map