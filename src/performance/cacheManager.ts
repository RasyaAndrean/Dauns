import * as fs from 'fs';
import { VariableInfo } from '../parsers/types';

// Define types
interface CachedResult {
  variables: VariableInfo[];
  lastModified: number;
  lastAccessed: number;
  size: number; // Approximate size in bytes
}

interface DependencyInfo {
  dependencies: string[];
  lastUpdated: number;
}

interface CacheStats {
  hitCount: number;
  missCount: number;
  totalRequests: number;
  cacheSize: number;
  maxCacheSize: number;
}

export class CacheManager {
  private fileCache = new Map<string, CachedResult>();
  private dependencyCache = new Map<string, DependencyInfo>();
  private stats: CacheStats = {
    hitCount: 0,
    missCount: 0,
    totalRequests: 0,
    cacheSize: 0,
    maxCacheSize: 50 * 1024 * 1024, // 50MB limit
  };

  // LRU tracking
  private accessOrder: string[] = [];
  private readonly maxCacheEntries = 1000;

  getCachedResult(filePath: string): CachedResult | null {
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
        } else {
          // File has been modified, remove outdated cache
          this.removeCachedResult(filePath);
        }
      } catch (error) {
        // File might have been deleted
        this.removeCachedResult(filePath);
      }
    }

    // Cache miss
    this.stats.missCount++;
    return null;
  }

  setCachedResult(filePath: string, variables: VariableInfo[]): void {
    try {
      const stats = fs.statSync(filePath);
      const lastModified = stats.mtimeMs;
      const size = this.estimateSize(variables);

      const cachedResult: CachedResult = {
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
    } catch (error) {
      console.error(`Error caching result for ${filePath}:`, error);
    }
  }

  private updateAccessOrder(filePath: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(filePath);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    // Add to end (most recently used)
    this.accessOrder.push(filePath);
  }

  private estimateSize(variables: VariableInfo[]): number {
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

  private cleanupOldEntries(): void {
    // Clean up based on size limit
    while (
      this.stats.cacheSize > this.stats.maxCacheSize &&
      this.fileCache.size > 0
    ) {
      // Remove least recently used entry
      if (this.accessOrder.length > 0) {
        const lruKey = this.accessOrder[0];
        this.removeCachedResult(lruKey);
      } else {
        // Fallback: remove first entry
        const firstKey = this.fileCache.keys().next().value;
        if (firstKey) {
          this.removeCachedResult(firstKey);
        }
      }
    }

    // Clean up based on entry count limit
    while (
      this.fileCache.size > this.maxCacheEntries &&
      this.accessOrder.length > 0
    ) {
      const lruKey = this.accessOrder[0];
      this.removeCachedResult(lruKey);
    }
  }

  private removeCachedResult(filePath: string): void {
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

  getDependencyInfo(filePath: string): DependencyInfo | null {
    return this.dependencyCache.get(filePath) || null;
  }

  setDependencyInfo(filePath: string, dependencies: string[]): void {
    const depInfo: DependencyInfo = {
      dependencies,
      lastUpdated: Date.now(),
    };
    this.dependencyCache.set(filePath, depInfo);
  }

  getCacheStats(): CacheStats {
    return { ...this.stats };
  }

  getCacheHitRate(): number {
    if (this.stats.totalRequests === 0) return 0;
    return this.stats.hitCount / this.stats.totalRequests;
  }

  clearCache(): void {
    this.fileCache.clear();
    this.dependencyCache.clear();
    this.accessOrder = [];
    this.stats.cacheSize = 0;
    this.stats.hitCount = 0;
    this.stats.missCount = 0;
    this.stats.totalRequests = 0;
  }

  dispose(): void {
    this.clearCache();
  }
}
