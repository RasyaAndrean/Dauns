interface PerformanceTimer {
  operationName: string;
  startTime: number;
  end: () => void;
}

interface PerformanceMetrics {
  scanDuration: number[];
  memoryUsage: number[];
  cacheHitRate: number;
  errorRate: number;
  operationCounts: Map<string, number>;
  operationDurations: Map<string, number[]>;
}

interface PerformanceReport {
  averageScanTime: number;
  memoryTrend: number[];
  cacheEfficiency: number;
  errorRate: number;
  recommendations: string[];
  operationStats: Map<string, { count: number; averageDuration: number }>;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    scanDuration: [],
    memoryUsage: [],
    cacheHitRate: 0,
    errorRate: 0,
    operationCounts: new Map(),
    operationDurations: new Map(),
  };

  private errorCount = 0;
  private totalOperations = 0;
  private monitoringInterval: NodeJS.Timeout | null = null;

  startOperation(operationName: string): PerformanceTimer {
    const startTime = performance.now();
    this.totalOperations++;

    // Track operation count
    const currentCount = this.metrics.operationCounts.get(operationName) || 0;
    this.metrics.operationCounts.set(operationName, currentCount + 1);

    return {
      operationName,
      startTime,
      end: () => this.endOperation(operationName, startTime, performance.now()),
    };
  }

  private endOperation(name: string, startTime: number, endTime: number): void {
    const duration = endTime - startTime;

    // Store duration for this operation type
    if (!this.metrics.operationDurations.has(name)) {
      this.metrics.operationDurations.set(name, []);
    }

    const durations = this.metrics.operationDurations.get(name)!;
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
      const memoryUsage = process.memoryUsage();
      this.metrics.memoryUsage.push(memoryUsage.heapUsed);
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
    }
  }

  recordError(): void {
    this.errorCount++;
    this.metrics.errorRate =
      this.errorCount / Math.max(this.totalOperations, 1);
  }

  recordCacheHit(): void {
    // This is a simplified approach - in a real implementation,
    // you would track hits/misses from the cache manager
    this.metrics.cacheHitRate = Math.min(1, this.metrics.cacheHitRate + 0.01);
  }

  recordCacheMiss(): void {
    this.metrics.cacheHitRate = Math.max(0, this.metrics.cacheHitRate - 0.01);
  }

  startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      // Record periodic metrics
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memoryUsage = process.memoryUsage();
        this.metrics.memoryUsage.push(memoryUsage.heapUsed);
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage.shift();
        }
      }
    }, 5000); // Record every 5 seconds
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  getPerformanceReport(): PerformanceReport {
    return {
      averageScanTime: this.calculateAverage(this.metrics.scanDuration),
      memoryTrend: [...this.metrics.memoryUsage],
      cacheEfficiency: this.metrics.cacheHitRate,
      errorRate: this.metrics.errorRate,
      recommendations: this.generateRecommendations(),
      operationStats: this.calculateOperationStats(),
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  private calculateOperationStats(): Map<
    string,
    { count: number; averageDuration: number }
  > {
    const stats = new Map<string, { count: number; averageDuration: number }>();

    this.metrics.operationCounts.forEach((count, operationName) => {
      const durations =
        this.metrics.operationDurations.get(operationName) || [];
      const averageDuration = this.calculateAverage(durations);

      stats.set(operationName, {
        count,
        averageDuration,
      });
    });

    return stats;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Scan time recommendations
    const avgScanTime = this.calculateAverage(this.metrics.scanDuration);
    if (avgScanTime > 1000) {
      // More than 1 second
      recommendations.push('Consider enabling caching for large files');
      recommendations.push(
        'Large file scanning may benefit from async processing'
      );
    }

    // Memory recommendations
    if (this.metrics.memoryUsage.length > 10) {
      const recentMemory = this.metrics.memoryUsage.slice(-10);
      const avgMemory = this.calculateAverage(recentMemory);
      if (avgMemory > 100 * 1024 * 1024) {
        // More than 100MB
        recommendations.push(
          'High memory usage detected - consider clearing caches periodically'
        );
      }
    }

    // Cache efficiency recommendations
    if (this.metrics.cacheHitRate < 0.5) {
      recommendations.push(
        'Low cache hit rate - consider adjusting cache invalidation strategy'
      );
    }

    // Error rate recommendations
    if (this.metrics.errorRate > 0.05) {
      // More than 5% errors
      recommendations.push(
        'High error rate detected - check error logs for patterns'
      );
    }

    // If no recommendations, add a positive message
    if (recommendations.length === 0) {
      recommendations.push(
        'Performance is optimal - no immediate actions required'
      );
    }

    return recommendations;
  }

  resetMetrics(): void {
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
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  dispose(): void {
    this.stopMonitoring();
    this.resetMetrics();
  }
}
