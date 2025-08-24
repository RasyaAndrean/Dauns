"use strict";
/**
 * AI Module for DAUNS - Variable Detective
 *
 * This module provides intelligent analysis and insights for variable usage,
 * code quality, security, and team collaboration features.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamCollaborationManager = exports.t = exports.SecurityVulnerabilityType = exports.SecurityVulnerabilitySeverity = exports.SecurityAnalyzer = exports.I18nManager = exports.CodeQualityAnalyzer = exports.AIVariableAnalyzer = void 0;
__exportStar(require("./codeQualityAnalyzer"), exports);
__exportStar(require("./i18n"), exports);
__exportStar(require("./securityAnalyzer"), exports);
__exportStar(require("./teamCollaboration"), exports);
__exportStar(require("./variableAnalyzer"), exports);
// Re-export common types and interfaces for convenience
const codeQualityAnalyzer_1 = require("./codeQualityAnalyzer");
Object.defineProperty(exports, "CodeQualityAnalyzer", { enumerable: true, get: function () { return codeQualityAnalyzer_1.CodeQualityAnalyzer; } });
const i18n_1 = require("./i18n");
Object.defineProperty(exports, "I18nManager", { enumerable: true, get: function () { return i18n_1.I18nManager; } });
Object.defineProperty(exports, "t", { enumerable: true, get: function () { return i18n_1.t; } });
const securityAnalyzer_1 = require("./securityAnalyzer");
Object.defineProperty(exports, "SecurityAnalyzer", { enumerable: true, get: function () { return securityAnalyzer_1.SecurityAnalyzer; } });
Object.defineProperty(exports, "SecurityVulnerabilitySeverity", { enumerable: true, get: function () { return securityAnalyzer_1.SecurityVulnerabilitySeverity; } });
Object.defineProperty(exports, "SecurityVulnerabilityType", { enumerable: true, get: function () { return securityAnalyzer_1.SecurityVulnerabilityType; } });
const teamCollaboration_1 = require("./teamCollaboration");
Object.defineProperty(exports, "TeamCollaborationManager", { enumerable: true, get: function () { return teamCollaboration_1.TeamCollaborationManager; } });
const variableAnalyzer_1 = require("./variableAnalyzer");
Object.defineProperty(exports, "AIVariableAnalyzer", { enumerable: true, get: function () { return variableAnalyzer_1.AIVariableAnalyzer; } });
//# sourceMappingURL=index.js.map