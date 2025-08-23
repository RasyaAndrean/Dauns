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
exports.CacheManager = void 0;
var fs = __importStar(require("fs"));
var CacheManager = /** @class */ (function () {
    function CacheManager() {
        this.fileCache = new Map();
        this.dependencyCache = new Map();
        this.stats = {
            hitCount: 0,
            missCount: 0,
            totalRequests: 0,
            cacheSize: 0,
            maxCacheSize: 50 * 1024 * 1024, // 50MB limit
        };
        // LRU tracking
        this.accessOrder = [];
        this.maxCacheEntries = 1000;
    }
    CacheManager.prototype.getCachedResult = function (filePath) {
        this.stats.totalRequests++;
        var cached = this.fileCache.get(filePath);
        if (cached) {
            // Check if file has been modified since caching
            try {
                var stats = fs.statSync(filePath);
                var lastModified = stats.mtimeMs;
                if (cached.lastModified >= lastModified) {
                    // Cache hit - update access time and order
                    cached.lastAccessed = Date.now();
                    this.updateAccessOrder(filePath);
                    this.stats.hitCount++;
                    return cached;
                }
                else {
                    // File has been modified, remove outdated cache
                    this.removeCachedResult(filePath);
                }
            }
            catch (error) {
                // File might have been deleted
                this.removeCachedResult(filePath);
            }
        }
        // Cache miss
        this.stats.missCount++;
        return null;
    };
    CacheManager.prototype.setCachedResult = function (filePath, variables) {
        try {
            var stats = fs.statSync(filePath);
            var lastModified = stats.mtimeMs;
            var size = this.estimateSize(variables);
            var cachedResult = {
                variables: variables,
                lastModified: lastModified,
                lastAccessed: Date.now(),
                size: size,
            };
            // Remove old entry if it exists
            if (this.fileCache.has(filePath)) {
                var oldEntry = this.fileCache.get(filePath);
                if (oldEntry) {
                    this.stats.cacheSize -= oldEntry.size;
                }
            }
            // Add new entry
            this.fileCache.set(filePath, cachedResult);
            this.stats.cacheSize += size;
            this.updateAccessOrder(filePath);
            // Cleanup if necessary
            this.cleanupOldEntries();
        }
        catch (error) {
            console.error("Error caching result for ".concat(filePath, ":"), error);
        }
    };
    CacheManager.prototype.updateAccessOrder = function (filePath) {
        // Remove from current position
        var index = this.accessOrder.indexOf(filePath);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        // Add to end (most recently used)
        this.accessOrder.push(filePath);
    };
    CacheManager.prototype.estimateSize = function (variables) {
        // Rough estimation of memory usage
        // This is a simplified calculation
        var size = 0;
        for (var _i = 0, variables_1 = variables; _i < variables_1.length; _i++) {
            var variable = variables_1[_i];
            size += variable.name.length * 2; // UTF-16 characters
            size += variable.type.length * 2;
            size += variable.declarationType.length * 2;
            size += 32; // Approximate overhead per variable
        }
        return size;
    };
    CacheManager.prototype.cleanupOldEntries = function () {
        // Clean up based on size limit
        while (this.stats.cacheSize > this.stats.maxCacheSize &&
            this.fileCache.size > 0) {
            // Remove least recently used entry
            if (this.accessOrder.length > 0) {
                var lruKey = this.accessOrder[0];
                this.removeCachedResult(lruKey);
            }
            else {
                // Fallback: remove first entry
                var firstKey = this.fileCache.keys().next().value;
                if (firstKey) {
                    this.removeCachedResult(firstKey);
                }
            }
        }
        // Clean up based on entry count limit
        while (this.fileCache.size > this.maxCacheEntries &&
            this.accessOrder.length > 0) {
            var lruKey = this.accessOrder[0];
            this.removeCachedResult(lruKey);
        }
    };
    CacheManager.prototype.removeCachedResult = function (filePath) {
        var cached = this.fileCache.get(filePath);
        if (cached) {
            this.stats.cacheSize -= cached.size;
            this.fileCache.delete(filePath);
            // Remove from access order
            var index = this.accessOrder.indexOf(filePath);
            if (index > -1) {
                this.accessOrder.splice(index, 1);
            }
        }
    };
    CacheManager.prototype.getDependencyInfo = function (filePath) {
        return this.dependencyCache.get(filePath) || null;
    };
    CacheManager.prototype.setDependencyInfo = function (filePath, dependencies) {
        var depInfo = {
            dependencies: dependencies,
            lastUpdated: Date.now(),
        };
        this.dependencyCache.set(filePath, depInfo);
    };
    CacheManager.prototype.getCacheStats = function () {
        return __assign({}, this.stats);
    };
    CacheManager.prototype.getCacheHitRate = function () {
        if (this.stats.totalRequests === 0)
            return 0;
        return this.stats.hitCount / this.stats.totalRequests;
    };
    CacheManager.prototype.clearCache = function () {
        this.fileCache.clear();
        this.dependencyCache.clear();
        this.accessOrder = [];
        this.stats.cacheSize = 0;
        this.stats.hitCount = 0;
        this.stats.missCount = 0;
        this.stats.totalRequests = 0;
    };
    CacheManager.prototype.dispose = function () {
        this.clearCache();
    };
    return CacheManager;
}());
exports.CacheManager = CacheManager;
