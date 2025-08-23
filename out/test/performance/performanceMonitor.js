"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.PerformanceMonitor = void 0;
var PerformanceMonitor = /** @class */ (function () {
    function PerformanceMonitor() {
        this.metrics = {
            scanDuration: [],
            memoryUsage: [],
            cacheHitRate: 0,
            errorRate: 0,
            operationCounts: new Map(),
            operationDurations: new Map(),
        };
        this.errorCount = 0;
        this.totalOperations = 0;
        this.monitoringInterval = null;
    }
    PerformanceMonitor.prototype.startOperation = function (operationName) {
        var _this = this;
        var startTime = performance.now();
        this.totalOperations++;
        // Track operation count
        var currentCount = this.metrics.operationCounts.get(operationName) || 0;
        this.metrics.operationCounts.set(operationName, currentCount + 1);
        return {
            operationName: operationName,
            startTime: startTime,
            end: function () { return _this.endOperation(operationName, startTime, performance.now()); },
        };
    };
    PerformanceMonitor.prototype.endOperation = function (name, startTime, endTime) {
        var duration = endTime - startTime;
        // Store duration for this operation type
        if (!this.metrics.operationDurations.has(name)) {
            this.metrics.operationDurations.set(name, []);
        }
        var durations = this.metrics.operationDurations.get(name);
        durations.push(duration);
        // Keep only recent durations (last 100)
        if (durations.length > 100) {
            durations.shift();
        }
        // Special handling for scan operations
        if (name.includes('scan')) {
            this.metrics.scanDuration.push(duration);
            if (this.metrics.scanDuration.length > 100) {
                this.metrics.scanDuration.shift();
            }
        }
        // Record memory usage
        if (typeof process !== 'undefined' && process.memoryUsage) {
            var memoryUsage = process.memoryUsage();
            this.metrics.memoryUsage.push(memoryUsage.heapUsed);
            if (this.metrics.memoryUsage.length > 100) {
                this.metrics.memoryUsage.shift();
            }
        }
    };
    PerformanceMonitor.prototype.recordError = function () {
        this.errorCount++;
        this.metrics.errorRate =
            this.errorCount / Math.max(this.totalOperations, 1);
    };
    PerformanceMonitor.prototype.recordCacheHit = function () {
        // This is a simplified approach - in a real implementation,
        // you would track hits/misses from the cache manager
        this.metrics.cacheHitRate = Math.min(1, this.metrics.cacheHitRate + 0.01);
    };
    PerformanceMonitor.prototype.recordCacheMiss = function () {
        this.metrics.cacheHitRate = Math.max(0, this.metrics.cacheHitRate - 0.01);
    };
    PerformanceMonitor.prototype.startMonitoring = function () {
        var _this = this;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.monitoringInterval = setInterval(function () {
            // Record periodic metrics
            if (typeof process !== 'undefined' && process.memoryUsage) {
                var memoryUsage = process.memoryUsage();
                _this.metrics.memoryUsage.push(memoryUsage.heapUsed);
                if (_this.metrics.memoryUsage.length > 100) {
                    _this.metrics.memoryUsage.shift();
                }
            }
        }, 5000); // Record every 5 seconds
    };
    PerformanceMonitor.prototype.stopMonitoring = function () {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    };
    PerformanceMonitor.prototype.getPerformanceReport = function () {
        return {
            averageScanTime: this.calculateAverage(this.metrics.scanDuration),
            memoryTrend: __spreadArray([], this.metrics.memoryUsage, true),
            cacheEfficiency: this.metrics.cacheHitRate,
            errorRate: this.metrics.errorRate,
            recommendations: this.generateRecommendations(),
            operationStats: this.calculateOperationStats(),
        };
    };
    PerformanceMonitor.prototype.calculateAverage = function (values) {
        if (values.length === 0)
            return 0;
        var sum = values.reduce(function (acc, val) { return acc + val; }, 0);
        return sum / values.length;
    };
    PerformanceMonitor.prototype.calculateOperationStats = function () {
        var _this = this;
        var stats = new Map();
        this.metrics.operationCounts.forEach(function (count, operationName) {
            var durations = _this.metrics.operationDurations.get(operationName) || [];
            var averageDuration = _this.calculateAverage(durations);
            stats.set(operationName, {
                count: count,
                averageDuration: averageDuration,
            });
        });
        return stats;
    };
    PerformanceMonitor.prototype.generateRecommendations = function () {
        var recommendations = [];
        // Scan time recommendations
        var avgScanTime = this.calculateAverage(this.metrics.scanDuration);
        if (avgScanTime > 1000) {
            // More than 1 second
            recommendations.push('Consider enabling caching for large files');
            recommendations.push('Large file scanning may benefit from async processing');
        }
        // Memory recommendations
        if (this.metrics.memoryUsage.length > 10) {
            var recentMemory = this.metrics.memoryUsage.slice(-10);
            var avgMemory = this.calculateAverage(recentMemory);
            if (avgMemory > 100 * 1024 * 1024) {
                // More than 100MB
                recommendations.push('High memory usage detected - consider clearing caches periodically');
            }
        }
        // Cache efficiency recommendations
        if (this.metrics.cacheHitRate < 0.5) {
            recommendations.push('Low cache hit rate - consider adjusting cache invalidation strategy');
        }
        // Error rate recommendations
        if (this.metrics.errorRate > 0.05) {
            // More than 5% errors
            recommendations.push('High error rate detected - check error logs for patterns');
        }
        // If no recommendations, add a positive message
        if (recommendations.length === 0) {
            recommendations.push('Performance is optimal - no immediate actions required');
        }
        return recommendations;
    };
    PerformanceMonitor.prototype.resetMetrics = function () {
        this.metrics = {
            scanDuration: [],
            memoryUsage: [],
            cacheHitRate: 0,
            errorRate: 0,
            operationCounts: new Map(),
            operationDurations: new Map(),
        };
        this.errorCount = 0;
        this.totalOperations = 0;
    };
    PerformanceMonitor.prototype.getMetrics = function () {
        return __assign({}, this.metrics);
    };
    PerformanceMonitor.prototype.dispose = function () {
        this.stopMonitoring();
        this.resetMetrics();
    };
    return PerformanceMonitor;
}());
exports.PerformanceMonitor = PerformanceMonitor;
