export class DebounceManager {
  private pendingUpdates = new Map<string, NodeJS.Timeout>();
  private debounceDelay: number;

  constructor(debounceDelay: number = 300) {
    this.debounceDelay = debounceDelay;
  }

  debounceFileUpdate(filePath: string, callback: () => void): void {
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

  debounceWorkspaceUpdate(callback: () => void): void {
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

  cancelPendingUpdate(filePath: string): void {
    const timer = this.pendingUpdates.get(filePath);
    if (timer) {
      clearTimeout(timer);
      this.pendingUpdates.delete(filePath);
    }
  }

  cancelAllPendingUpdates(): void {
    this.pendingUpdates.forEach(timer => {
      clearTimeout(timer);
    });
    this.pendingUpdates.clear();
  }

  getPendingUpdateCount(): number {
    return this.pendingUpdates.size;
  }

  setDebounceDelay(delay: number): void {
    this.debounceDelay = delay;
  }

  getDebounceDelay(): number {
    return this.debounceDelay;
  }

  dispose(): void {
    this.cancelAllPendingUpdates();
  }
}
