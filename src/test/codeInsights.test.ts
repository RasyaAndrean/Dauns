import assert from 'assert';
import { CodeInsightsAnalyzer } from '../analysis/codeInsights';
import { VariableUsageInfo } from '../analysis/variableUsageTracker';

suite('Code Insights Test Suite', () => {
  test('Should analyze code correctly', () => {
    // Create mock variable data
    const mockVariables: VariableUsageInfo[] = [
      {
        name: 'unusedVar',
        type: 'string',
        declarationType: 'const',
        line: 1,
        character: 1,
        filePath: '/test/file.js',
        scope: 'local',
        value: '"test"',
        references: [],
        usageCount: 0,
        declarationCount: 1,
        isUnused: true,
        isWriteOnly: false,
      },
      {
        name: 'writeOnlyVar',
        type: 'number',
        declarationType: 'let',
        line: 2,
        character: 1,
        filePath: '/test/file.js',
        scope: 'local',
        value: '42',
        references: [{ line: 3, character: 1, context: 'writeOnlyVar = 43;' }],
        usageCount: 1,
        declarationCount: 1,
        isUnused: false,
        isWriteOnly: true,
      },
      {
        name: 'varVar',
        type: 'boolean',
        declarationType: 'var',
        line: 4,
        character: 1,
        filePath: '/test/file.js',
        scope: 'local',
        value: 'true',
        references: [
          { line: 4, character: 1, context: 'var varVar = true;' },
          { line: 5, character: 10, context: 'console.log(varVar);' },
        ],
        usageCount: 1,
        declarationCount: 1,
        isUnused: false,
        isWriteOnly: false,
      },
    ];

    // Analyze the code
    const insights = CodeInsightsAnalyzer.analyzeCode(mockVariables);

    // Verify the results
    assert.strictEqual(insights.totalVariables, 3);

    // Check for code smells
    const unusedSmell = insights.codeSmells.find(
      s => s.variableName === 'unusedVar'
    );
    assert.ok(unusedSmell);
    assert.strictEqual(unusedSmell?.type, 'unusedVariable');

    const writeOnlySmell = insights.codeSmells.find(
      s => s.variableName === 'writeOnlyVar'
    );
    assert.ok(writeOnlySmell);
    assert.strictEqual(writeOnlySmell?.type, 'writeOnlyVariable');

    // Check for best practice violations
    const varViolation = insights.bestPracticeViolations.find(
      v => v.variableName === 'varVar'
    );
    assert.ok(varViolation);
    assert.strictEqual(varViolation?.type, 'varUsage');

    // Check that we have recommendations
    assert.ok(insights.recommendations.length > 0);
  });

  test('Should generate insights report', () => {
    // Create mock variable data
    const mockVariables: VariableUsageInfo[] = [
      {
        name: 'testVar',
        type: 'string',
        declarationType: 'const',
        line: 1,
        character: 1,
        filePath: '/test/file.js',
        scope: 'local',
        value: '"test"',
        references: [],
        usageCount: 0,
        declarationCount: 1,
        isUnused: true,
        isWriteOnly: false,
      },
    ];

    // Analyze the code
    const insights = CodeInsightsAnalyzer.analyzeCode(mockVariables);

    // Generate report
    const report = CodeInsightsAnalyzer.generateInsightsReport(insights);

    // Verify the report contains expected information
    assert(report.includes('Code Insights Report'));
    assert(report.includes('Total Variables Analyzed: 1'));
    assert(report.includes('testVar'));
  });
});
