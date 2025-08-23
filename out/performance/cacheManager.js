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
exports.CacheManager = void 0;
const fs = __importStar(require("fs"));
class CacheManager {
    constructor() {
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
    getCachedResult(filePath) {
        this.stats.totalRequests++;
        const cached = this.fileCache.get(filePath);
        if (cached) {
            // Check if file has been modified since caching
            try {
                const stats = fs.statSync(filePath);
                const lastModified = stats.mtimeMs;
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
    }
    setCachedResult(filePath, variables) {
        try {
            const stats = fs.statSync(filePath);
            const lastModified = stats.mtimeMs;
            const size = this.estimateSize(variables);
            const cachedResult = {
                variables,
                lastModified,
                lastAccessed: Date.now(),
                size,
            };
            // Remove old entry if it exists
            if (this.fileCache.has(filePath)) {
                const oldEntry = this.fileCache.get(filePath);
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
            console.error(`Error caching result for ${filePath}:`, error);
        }
    }
    updateAccessOrder(filePath) {
        // Remove from current position
        const index = this.accessOrder.indexOf(filePath);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        // Add to end (most recently used)
        this.accessOrder.push(filePath);
    }
    estimateSize(variables) {
        // Rough estimation of memory usage
        // This is a simplified calculation
        let size = 0;
        for (const variable of variables) {
            size += variable.name.length * 2; // UTF-16 characters
            size += variable.type.length * 2;
            size += variable.declarationType.length * 2;
            size += 32; // Approximate overhead per variable
        }
        return size;
    }
    cleanupOldEntries() {
        // Clean up based on size limit
        while (this.stats.cacheSize > this.stats.maxCacheSize &&
            this.fileCache.size > 0) {
            // Remove least recently used entry
            if (this.accessOrder.length > 0) {
                const lruKey = this.accessOrder[0];
                this.removeCachedResult(lruKey);
            }
            else {
                // Fallback: remove first entry
                const firstKey = this.fileCache.keys().next().value;
                if (firstKey) {
                    this.removeCachedResult(firstKey);
                }
            }
        }
        // Clean up based on entry count limit
        while (this.fileCache.size > this.maxCacheEntries &&
            this.accessOrder.length > 0) {
            const lruKey = this.accessOrder[0];
            this.removeCachedResult(lruKey);
        }
    }
    removeCachedResult(filePath) {
        const cached = this.fileCache.get(filePath);
        if (cached) {
            this.stats.cacheSize -= cached.size;
            this.fileCache.delete(filePath);
            // Remove from access order
            const index = this.accessOrder.indexOf(filePath);
            if (index > -1) {
                this.accessOrder.splice(index, 1);
            }
        }
    }
    getDependencyInfo(filePath) {
        return this.dependencyCache.get(filePath) || null;
    }
    setDependencyInfo(filePath, dependencies) {
        const depInfo = {
            dependencies,
            lastUpdated: Date.now(),
        };
        this.dependencyCache.set(filePath, depInfo);
    }
    getCacheStats() {
        return { ...this.stats };
    }
    getCacheHitRate() {
        if (this.stats.totalRequests === 0)
            return 0;
        return this.stats.hitCount / this.stats.totalRequests;
    }
    clearCache() {
        this.fileCache.clear();
        this.dependencyCache.clear();
        this.accessOrder = [];
        this.stats.cacheSize = 0;
        this.stats.hitCount = 0;
        this.stats.missCount = 0;
        this.stats.totalRequests = 0;
    }
    dispose() {
        this.clearCache();
    }
}
exports.CacheManager = CacheManager;
//# sourceMappingURL=cacheManager.js.map