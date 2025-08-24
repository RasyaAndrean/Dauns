/**
 * AI Module for DAUNS - Variable Detective
 *
 * This module provides intelligent analysis and insights for variable usage,
 * code quality, security, and team collaboration features.
 */

export * from './codeQualityAnalyzer';
export * from './i18n';
export * from './securityAnalyzer';
export * from './teamCollaboration';
export * from './variableAnalyzer';

// Re-export common types and interfaces for convenience
import {
  CodeQualityAnalyzer,
  CodeQualityMetrics,
  FileComplexityMetrics,
} from './codeQualityAnalyzer';
import { I18nManager, t } from './i18n';
import {
  SecurityAnalyzer,
  SecurityVulnerability,
  SecurityVulnerabilitySeverity,
  SecurityVulnerabilityType,
} from './securityAnalyzer';
import {
  ExportFormat,
  TeamAnalysis,
  TeamCollaborationManager,
  TeamComment,
} from './teamCollaboration';
import {
  AIAnalysisResult,
  AIVariableAnalyzer,
  VariableQualityScore,
} from './variableAnalyzer';

export {
  AIAnalysisResult,
  AIVariableAnalyzer,
  CodeQualityAnalyzer,
  CodeQualityMetrics,
  ExportFormat,
  FileComplexityMetrics,
  I18nManager,
  SecurityAnalyzer,
  SecurityVulnerability,
  SecurityVulnerabilitySeverity,
  SecurityVulnerabilityType,
  t,
  TeamAnalysis,
  TeamCollaborationManager,
  TeamComment,
  VariableQualityScore,
};
