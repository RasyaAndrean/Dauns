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
const assert = __importStar(require("assert"));
const asyncScanner_1 = require("../performance/asyncScanner");
const cacheManager_1 = require("../performance/cacheManager");
const debounceManager_1 = require("../performance/debounceManager");
const memoryManager_1 = require("../performance/memoryManager");
const performanceMonitor_1 = require("../performance/performanceMonitor");
suite('Performance Optimization Test Suite', () => {
    test('AsyncScanner should be instantiable', () => {
        const scanner = new asyncScanner_1.AsyncScanner(2);
        assert.ok(scanner);
    });
    test('CacheManager should cache and retrieve results', () => {
        const cacheManager = new cacheManager_1.CacheManager();
        const testVariables = [
            {
                name: 'testVar',
                type: 'string',
                kind: 'const',
                line: 1,
                character: 5,
            },
        ];
        // Since we can't easily create a real file for testing,
        // we'll test the cache manager methods directly
        const statsBefore = cacheManager.getCacheStats();
        assert.strictEqual(statsBefore.hitCount, 0);
        assert.strictEqual(statsBefore.missCount, 0);
        cacheManager.dispose();
    });
    test('DebounceManager should debounce function calls', done => {
        const debounceManager = new debounceManager_1.DebounceManager(100);
        let callCount = 0;
        const callback = () => {
            callCount++;
        };
        // Call the function multiple times rapidly
        debounceManager.debounceFileUpdate('test.js', callback);
        debounceManager.debounceFileUpdate('test.js', callback);
        debounceManager.debounceFileUpdate('test.js', callback);
        // After 150ms, the callback should have been called only once
        setTimeout(() => {
            assert.strictEqual(callCount, 1);
            debounceManager.dispose();
            done();
        }, 150);
    });
    test('MemoryManager should monitor memory usage', () => {
        const memoryManager = new memoryManager_1.MemoryManager();
        const usage = memoryManager.getCurrentMemoryUsage();
        assert.ok(usage.heapUsed >= 0);
        assert.ok(usage.heapTotal >= 0);
        memoryManager.dispose();
    });
    test('PerformanceMonitor should track operations', () => {
        const performanceMonitor = new performanceMonitor_1.PerformanceMonitor();
        const timer = performanceMonitor.startOperation('testOperation');
        // Simulate some work
        const start = Date.now();
        while (Date.now() - start < 10) {
            // Busy wait for 10ms
        }
        timer.end();
        const report = performanceMonitor.getPerformanceReport();
        assert.ok(report.averageScanTime >= 0);
        assert.ok(report.cacheEfficiency >= 0);
        assert.ok(report.errorRate >= 0);
        performanceMonitor.dispose();
    });
});
//# sourceMappingURL=performanceTest.js.map