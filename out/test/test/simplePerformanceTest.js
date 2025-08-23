"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Simple test to verify performance components work
var asyncScanner_1 = require("../performance/asyncScanner");
var cacheManager_1 = require("../performance/cacheManager");
var debounceManager_1 = require("../performance/debounceManager");
var memoryManager_1 = require("../performance/memoryManager");
var performanceMonitor_1 = require("../performance/performanceMonitor");
console.log('Testing performance components...');
// Test AsyncScanner
try {
    var asyncScanner = new asyncScanner_1.AsyncScanner(2);
    console.log('✓ AsyncScanner created successfully');
}
catch (error) {
    console.error('✗ Error creating AsyncScanner:', error);
}
// Test CacheManager
try {
    var cacheManager = new cacheManager_1.CacheManager();
    console.log('✓ CacheManager created successfully');
    // Test cache stats
    var stats = cacheManager.getCacheStats();
    console.log('✓ Cache stats retrieved successfully');
}
catch (error) {
    console.error('✗ Error with CacheManager:', error);
}
// Test DebounceManager
try {
    var debounceManager = new debounceManager_1.DebounceManager(100);
    console.log('✓ DebounceManager created successfully');
    // Test debounce delay
    console.log('✓ Debounce delay:', debounceManager.getDebounceDelay());
}
catch (error) {
    console.error('✗ Error with DebounceManager:', error);
}
// Test MemoryManager
try {
    var memoryManager = new memoryManager_1.MemoryManager();
    console.log('✓ MemoryManager created successfully');
    // Test memory usage
    var usage = memoryManager.getCurrentMemoryUsage();
    console.log('✓ Memory usage retrieved successfully');
}
catch (error) {
    console.error('✗ Error with MemoryManager:', error);
}
// Test PerformanceMonitor
try {
    var performanceMonitor = new performanceMonitor_1.PerformanceMonitor();
    console.log('✓ PerformanceMonitor created successfully');
    // Test operation tracking
    var timer = performanceMonitor.startOperation('test');
    timer.end();
    var report = performanceMonitor.getPerformanceReport();
    console.log('✓ Performance report generated successfully');
}
catch (error) {
    console.error('✗ Error with PerformanceMonitor:', error);
}
console.log('Performance component tests completed.');
