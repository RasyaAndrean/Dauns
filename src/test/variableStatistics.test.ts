import assert from 'assert';
import { VariableStatisticsAnalyzer } from '../analysis/variableStatistics';
import { VariableUsageInfo } from '../analysis/variableUsageTracker';

suite('Variable Statistics Test Suite', () => {
  test('Should analyze variables correctly', () => {
    // Create mock variable data
    const mockVariables: VariableUsageInfo[] = [
      {
        name: 'testVar1',
        type: 'string',
        declarationType: 'const',
        line: 1,
        character: 1,
        filePath: '/test/file.js',
        scope: 'local',
        value: '"test"',
        references: [
          { line: 1, character: 1, context: 'const testVar1 = "test";' },
          { line: 2, character: 10, context: 'console.log(testVar1);' },
        ],
        usageCount: 1,
        declarationCount: 1,
        isUnused: false,
        isWriteOnly: false,
      },
      {
        name: 'testVar2',
        type: 'number',
        declarationType: 'let',
        line: 3,
        character: 1,
        filePath: '/test/file.js',
        scope: 'local',
        value: '42',
        references: [{ line: 3, character: 1, context: 'let testVar2 = 42;' }],
        usageCount: 0,
        declarationCount: 1,
        isUnused: true,
        isWriteOnly: false,
      },
    ];

    // Analyze the variables
    const stats = VariableStatisticsAnalyzer.analyzeVariables(mockVariables);

    // Verify the results
    assert.strictEqual(stats.totalVariables, 2);
    assert.strictEqual(stats.variableTypes['string'], 1);
    assert.strictEqual(stats.variableTypes['number'], 1);
    assert.strictEqual(stats.declarationTypes['const'], 1);
    assert.strictEqual(stats.declarationTypes['let'], 1);
    assert.strictEqual(stats.usageDistribution.unused, 1);
    assert.strictEqual(stats.usageDistribution.active, 1);
    assert.strictEqual(stats.mostUsedVariables.length, 1);
    assert.strictEqual(stats.mostUsedVariables[0].name, 'testVar1');
  });

  test('Should generate statistics report', () => {
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
        references: [
          { line: 1, character: 1, context: 'const testVar = "test";' },
        ],
        usageCount: 0,
        declarationCount: 1,
        isUnused: true,
        isWriteOnly: false,
      },
    ];

    // Analyze the variables
    const stats = VariableStatisticsAnalyzer.analyzeVariables(mockVariables);

    // Generate report
    const report = VariableStatisticsAnalyzer.generateStatisticsReport(stats);

    // Verify the report contains expected information
    assert(report.includes('Variable Statistics Report'));
    assert(report.includes('Total Variables: 1'));
    assert(report.includes('string: 1'));
    assert(report.includes('const: 1'));
  });
});
