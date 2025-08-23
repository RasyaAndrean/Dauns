"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebounceManager = void 0;
var DebounceManager = /** @class */ (function () {
    function DebounceManager(debounceDelay) {
        if (debounceDelay === void 0) { debounceDelay = 300; }
        this.pendingUpdates = new Map();
        this.debounceDelay = debounceDelay;
    }
    DebounceManager.prototype.debounceFileUpdate = function (filePath, callback) {
        var _this = this;
        // Clear existing timer
        var existingTimer = this.pendingUpdates.get(filePath);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Set new timer
        var newTimer = setTimeout(function () {
            callback();
            _this.pendingUpdates.delete(filePath);
        }, this.debounceDelay);
        this.pendingUpdates.set(filePath, newTimer);
    };
    DebounceManager.prototype.debounceWorkspaceUpdate = function (callback) {
        var _this = this;
        // Use a special key for workspace updates
        var workspaceKey = '__workspace_update__';
        // Clear existing timer
        var existingTimer = this.pendingUpdates.get(workspaceKey);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Set new timer
        var newTimer = setTimeout(function () {
            callback();
            _this.pendingUpdates.delete(workspaceKey);
        }, this.debounceDelay);
        this.pendingUpdates.set(workspaceKey, newTimer);
    };
    DebounceManager.prototype.cancelPendingUpdate = function (filePath) {
        var timer = this.pendingUpdates.get(filePath);
        if (timer) {
            clearTimeout(timer);
            this.pendingUpdates.delete(filePath);
        }
    };
    DebounceManager.prototype.cancelAllPendingUpdates = function () {
        this.pendingUpdates.forEach(function (timer) {
            clearTimeout(timer);
        });
        this.pendingUpdates.clear();
    };
    DebounceManager.prototype.getPendingUpdateCount = function () {
        return this.pendingUpdates.size;
    };
    DebounceManager.prototype.setDebounceDelay = function (delay) {
        this.debounceDelay = delay;
    };
    DebounceManager.prototype.getDebounceDelay = function () {
        return this.debounceDelay;
    };
    DebounceManager.prototype.dispose = function () {
        this.cancelAllPendingUpdates();
    };
    return DebounceManager;
}());
exports.DebounceManager = DebounceManager;
