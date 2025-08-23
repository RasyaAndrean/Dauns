"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomTreeIcons = void 0;
class CustomTreeIcons {
    constructor() {
        this.iconMap = new Map();
        this.initializeIcons();
    }
    initializeIcons() {
        // Map variable types to custom icons
        this.iconMap.set('string', '$(symbol-string)');
        this.iconMap.set('number', '$(symbol-number)');
        this.iconMap.set('boolean', '$(symbol-boolean)');
        this.iconMap.set('function', '$(symbol-function)');
        this.iconMap.set('object', '$(symbol-object)');
        this.iconMap.set('array', '$(symbol-array)');
        this.iconMap.set('null', '$(symbol-null)');
        this.iconMap.set('undefined', '$(question)');
        this.iconMap.set('unknown', '$(symbol-variable)');
    }
    getIcon(variableType) {
        return this.iconMap.get(variableType.toLowerCase()) || '$(symbol-variable)';
    }
    getIconWithModifier(variable) {
        let icon = this.getIcon(variable.type);
        // Add modifiers based on variable properties
        if (!variable.references || variable.references.length === 0) {
            icon += ' $(warning)'; // Unused variable warning
        }
        if (variable.scope === 'global') {
            icon += ' $(globe)'; // Global scope indicator
        }
        return icon;
    }
}
exports.CustomTreeIcons = CustomTreeIcons;
//# sourceMappingURL=customTreeIcons.js.map