"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Simple test to verify performance components work
const asyncScanner_1 = require("../performance/asyncScanner");
const cacheManager_1 = require("../performance/cacheManager");
const debounceManager_1 = require("../performance/debounceManager");
const memoryManager_1 = require("../performance/memoryManager");
const performanceMonitor_1 = require("../performance/performanceMonitor");
console.log('Testing performance components...');
// Test AsyncScanner
try {
    const asyncScanner = new asyncScanner_1.AsyncScanner(2);
    console.log('✓ AsyncScanner created successfully');
}
catch (error) {
    console.error('✗ Error creating AsyncScanner:', error);
}
// Test CacheManager
try {
    const cacheManager = new cacheManager_1.CacheManager();
    console.log('✓ CacheManager created successfully');
    // Test cache stats
    const stats = cacheManager.getCacheStats();
    console.log('✓ Cache stats retrieved successfully');
}
catch (error) {
    console.error('✗ Error with CacheManager:', error);
}
// Test DebounceManager
try {
    const debounceManager = new debounceManager_1.DebounceManager(100);
    console.log('✓ DebounceManager created successfully');
    // Test debounce delay
    console.log('✓ Debounce delay:', debounceManager.getDebounceDelay());
}
catch (error) {
    console.error('✗ Error with DebounceManager:', error);
}
// Test MemoryManager
try {
    const memoryManager = new memoryManager_1.MemoryManager();
    console.log('✓ MemoryManager created successfully');
    // Test memory usage
    const usage = memoryManager.getCurrentMemoryUsage();
    console.log('✓ Memory usage retrieved successfully');
}
catch (error) {
    console.error('✗ Error with MemoryManager:', error);
}
// Test PerformanceMonitor
try {
    const performanceMonitor = new performanceMonitor_1.PerformanceMonitor();
    console.log('✓ PerformanceMonitor created successfully');
    // Test operation tracking
    const timer = performanceMonitor.startOperation('test');
    timer.end();
    const report = performanceMonitor.getPerformanceReport();
    console.log('✓ Performance report generated successfully');
}
catch (error) {
    console.error('✗ Error with PerformanceMonitor:', error);
}
console.log('Performance component tests completed.');
//# sourceMappingURL=simplePerformanceTest.js.map