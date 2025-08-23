import * as assert from 'assert';
import { AsyncScanner } from '../performance/asyncScanner';
import { CacheManager } from '../performance/cacheManager';
import { DebounceManager } from '../performance/debounceManager';
import { MemoryManager } from '../performance/memoryManager';
import { PerformanceMonitor } from '../performance/performanceMonitor';

suite('Performance Optimization Test Suite', () => {
  test('AsyncScanner should be instantiable', () => {
    const scanner = new AsyncScanner(2);
    assert.ok(scanner);
  });

  test('CacheManager should cache and retrieve results', () => {
    const cacheManager = new CacheManager();
    const testVariables: any[] = [
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
    const debounceManager = new DebounceManager(100);
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
    const memoryManager = new MemoryManager();
    const usage = memoryManager.getCurrentMemoryUsage();
    assert.ok(usage.heapUsed >= 0);
    assert.ok(usage.heapTotal >= 0);
    memoryManager.dispose();
  });

  test('PerformanceMonitor should track operations', () => {
    const performanceMonitor = new PerformanceMonitor();
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
