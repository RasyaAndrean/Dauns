"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebounceManager = void 0;
class DebounceManager {
    constructor(debounceDelay = 300) {
        this.pendingUpdates = new Map();
        this.debounceDelay = debounceDelay;
    }
    debounceFileUpdate(filePath, callback) {
        // Clear existing timer
        const existingTimer = this.pendingUpdates.get(filePath);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Set new timer
        const newTimer = setTimeout(() => {
            callback();
            this.pendingUpdates.delete(filePath);
        }, this.debounceDelay);
        this.pendingUpdates.set(filePath, newTimer);
    }
    debounceWorkspaceUpdate(callback) {
        // Use a special key for workspace updates
        const workspaceKey = '__workspace_update__';
        // Clear existing timer
        const existingTimer = this.pendingUpdates.get(workspaceKey);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Set new timer
        const newTimer = setTimeout(() => {
            callback();
            this.pendingUpdates.delete(workspaceKey);
        }, this.debounceDelay);
        this.pendingUpdates.set(workspaceKey, newTimer);
    }
    cancelPendingUpdate(filePath) {
        const timer = this.pendingUpdates.get(filePath);
        if (timer) {
            clearTimeout(timer);
            this.pendingUpdates.delete(filePath);
        }
    }
    cancelAllPendingUpdates() {
        this.pendingUpdates.forEach(timer => {
            clearTimeout(timer);
        });
        this.pendingUpdates.clear();
    }
    getPendingUpdateCount() {
        return this.pendingUpdates.size;
    }
    setDebounceDelay(delay) {
        this.debounceDelay = delay;
    }
    getDebounceDelay() {
        return this.debounceDelay;
    }
    dispose() {
        this.cancelAllPendingUpdates();
    }
}
exports.DebounceManager = DebounceManager;
//# sourceMappingURL=debounceManager.js.map