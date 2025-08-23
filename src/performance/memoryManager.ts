// Note: Memory management in Node.js/VS Code extensions is limited
// This implementation provides monitoring and cleanup utilities

import * as vscode from 'vscode';

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

interface MemoryThresholds {
  warning: number; // MB
  critical: number; // MB
}

export class MemoryManager {
  private memoryThresholds: MemoryThresholds = {
    warning: 100, // 100MB
    critical: 200, // 200MB
  };

  private monitoringInterval: NodeJS.Timeout | null = null;
  private cleanupCallbacks: (() => void)[] = [];
  private memoryUsageHistory: MemoryStats[] = [];
  private readonly historyLimit = 100;

  monitorMemoryUsage(): void {
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
      } else if (usageMB > this.memoryThresholds.warning) {
        console.warn(`High memory usage: ${usageMB.toFixed(2)}MB`);
        this.performCleanup();
      }
    }, 30000); // Check every 30 seconds
  }

  getCurrentMemoryUsage(): MemoryStats {
    return process.memoryUsage();
  }

  getMemoryUsageHistory(): MemoryStats[] {
    return [...this.memoryUsageHistory];
  }

  getAverageMemoryUsage(): MemoryStats {
    if (this.memoryUsageHistory.length === 0) {
      return this.getCurrentMemoryUsage();
    }

    const sum = this.memoryUsageHistory.reduce(
      (acc, curr) => ({
        heapUsed: acc.heapUsed + curr.heapUsed,
        heapTotal: acc.heapTotal + curr.heapTotal,
        external: acc.external + curr.external,
        arrayBuffers: acc.arrayBuffers + curr.arrayBuffers,
      }),
      { heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 }
    );

    const count = this.memoryUsageHistory.length;
    return {
      heapUsed: sum.heapUsed / count,
      heapTotal: sum.heapTotal / count,
      external: sum.external / count,
      arrayBuffers: sum.arrayBuffers / count,
    };
  }

  setMemoryThresholds(warning: number, critical: number): void {
    this.memoryThresholds = { warning, critical };
  }

  registerCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  unregisterCleanupCallback(callback: () => void): void {
    const index = this.cleanupCallbacks.indexOf(callback);
    if (index > -1) {
      this.cleanupCallbacks.splice(index, 1);
    }
  }

  performCleanup(): void {
    console.log('Performing memory cleanup...');

    // Execute registered cleanup callbacks
    for (const callback of this.cleanupCallbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Error during cleanup callback:', error);
      }
    }

    // Suggest garbage collection (only works with --expose-gc flag)
    if (global.gc) {
      global.gc();
    }
  }

  private performCriticalCleanup(): void {
    console.log('Performing critical memory cleanup...');

    // Execute all cleanup callbacks
    for (const callback of this.cleanupCallbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Error during critical cleanup callback:', error);
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Show warning to user
    vscode.window.showWarningMessage(
      'DAUNS extension is using high memory. Consider restarting VS Code if performance degrades.'
    );
  }

  getMemoryPressure(): 'low' | 'medium' | 'high' | 'critical' {
    const usage = this.getCurrentMemoryUsage();
    const usageMB = usage.heapUsed / (1024 * 1024);

    if (usageMB > this.memoryThresholds.critical) {
      return 'critical';
    } else if (usageMB > this.memoryThresholds.warning) {
      return 'high';
    } else if (usageMB > this.memoryThresholds.warning * 0.7) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  dispose(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.cleanupCallbacks = [];
    this.memoryUsageHistory = [];
  }
}
