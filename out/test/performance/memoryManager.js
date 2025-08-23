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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
var vscode = __importStar(require("vscode"));
var MemoryManager = /** @class */ (function () {
    function MemoryManager() {
        this.memoryThresholds = {
            warning: 100, // 100MB
            critical: 200, // 200MB
        };
        this.monitoringInterval = null;
        this.cleanupCallbacks = [];
        this.memoryUsageHistory = [];
        this.historyLimit = 100;
    }
    MemoryManager.prototype.monitorMemoryUsage = function () {
        var _this = this;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.monitoringInterval = setInterval(function () {
            var currentUsage = _this.getCurrentMemoryUsage();
            // Store usage history
            _this.memoryUsageHistory.push(currentUsage);
            if (_this.memoryUsageHistory.length > _this.historyLimit) {
                _this.memoryUsageHistory.shift();
            }
            // Check thresholds
            var usageMB = currentUsage.heapUsed / (1024 * 1024);
            if (usageMB > _this.memoryThresholds.critical) {
                console.warn("Critical memory usage: ".concat(usageMB.toFixed(2), "MB"));
                _this.performCriticalCleanup();
            }
            else if (usageMB > _this.memoryThresholds.warning) {
                console.warn("High memory usage: ".concat(usageMB.toFixed(2), "MB"));
                _this.performCleanup();
            }
        }, 30000); // Check every 30 seconds
    };
    MemoryManager.prototype.getCurrentMemoryUsage = function () {
        return process.memoryUsage();
    };
    MemoryManager.prototype.getMemoryUsageHistory = function () {
        return __spreadArray([], this.memoryUsageHistory, true);
    };
    MemoryManager.prototype.getAverageMemoryUsage = function () {
        if (this.memoryUsageHistory.length === 0) {
            return this.getCurrentMemoryUsage();
        }
        var sum = this.memoryUsageHistory.reduce(function (acc, curr) { return ({
            heapUsed: acc.heapUsed + curr.heapUsed,
            heapTotal: acc.heapTotal + curr.heapTotal,
            external: acc.external + curr.external,
            arrayBuffers: acc.arrayBuffers + curr.arrayBuffers,
        }); }, { heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 });
        var count = this.memoryUsageHistory.length;
        return {
            heapUsed: sum.heapUsed / count,
            heapTotal: sum.heapTotal / count,
            external: sum.external / count,
            arrayBuffers: sum.arrayBuffers / count,
        };
    };
    MemoryManager.prototype.setMemoryThresholds = function (warning, critical) {
        this.memoryThresholds = { warning: warning, critical: critical };
    };
    MemoryManager.prototype.registerCleanupCallback = function (callback) {
        this.cleanupCallbacks.push(callback);
    };
    MemoryManager.prototype.unregisterCleanupCallback = function (callback) {
        var index = this.cleanupCallbacks.indexOf(callback);
        if (index > -1) {
            this.cleanupCallbacks.splice(index, 1);
        }
    };
    MemoryManager.prototype.performCleanup = function () {
        console.log('Performing memory cleanup...');
        // Execute registered cleanup callbacks
        for (var _i = 0, _a = this.cleanupCallbacks; _i < _a.length; _i++) {
            var callback = _a[_i];
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
    };
    MemoryManager.prototype.performCriticalCleanup = function () {
        console.log('Performing critical memory cleanup...');
        // Execute all cleanup callbacks
        for (var _i = 0, _a = this.cleanupCallbacks; _i < _a.length; _i++) {
            var callback = _a[_i];
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
    };
    MemoryManager.prototype.getMemoryPressure = function () {
        var usage = this.getCurrentMemoryUsage();
        var usageMB = usage.heapUsed / (1024 * 1024);
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
    };
    MemoryManager.prototype.dispose = function () {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.cleanupCallbacks = [];
        this.memoryUsageHistory = [];
    };
    return MemoryManager;
}());
exports.MemoryManager = MemoryManager;
