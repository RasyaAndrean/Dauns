// Simple test to verify performance components work
import { AsyncScanner } from '../performance/asyncScanner';
import { CacheManager } from '../performance/cacheManager';
import { DebounceManager } from '../performance/debounceManager';
import { MemoryManager } from '../performance/memoryManager';
import { PerformanceMonitor } from '../performance/performanceMonitor';

console.log('Testing performance components...');

// Test AsyncScanner
try {
  const asyncScanner = new AsyncScanner(2);
  console.log('✓ AsyncScanner created successfully');
} catch (error) {
  console.error('✗ Error creating AsyncScanner:', error);
}

// Test CacheManager
try {
  const cacheManager = new CacheManager();
  console.log('✓ CacheManager created successfully');

  // Test cache stats
  const stats = cacheManager.getCacheStats();
  console.log('✓ Cache stats retrieved successfully');
} catch (error) {
  console.error('✗ Error with CacheManager:', error);
}

// Test DebounceManager
try {
  const debounceManager = new DebounceManager(100);
  console.log('✓ DebounceManager created successfully');

  // Test debounce delay
  console.log('✓ Debounce delay:', debounceManager.getDebounceDelay());
} catch (error) {
  console.error('✗ Error with DebounceManager:', error);
}

// Test MemoryManager
try {
  const memoryManager = new MemoryManager();
  console.log('✓ MemoryManager created successfully');

  // Test memory usage
  const usage = memoryManager.getCurrentMemoryUsage();
  console.log('✓ Memory usage retrieved successfully');
} catch (error) {
  console.error('✗ Error with MemoryManager:', error);
}

// Test PerformanceMonitor
try {
  const performanceMonitor = new PerformanceMonitor();
  console.log('✓ PerformanceMonitor created successfully');

  // Test operation tracking
  const timer = performanceMonitor.startOperation('test');
  timer.end();

  const report = performanceMonitor.getPerformanceReport();
  console.log('✓ Performance report generated successfully');
} catch (error) {
  console.error('✗ Error with PerformanceMonitor:', error);
}

console.log('Performance component tests completed.');
