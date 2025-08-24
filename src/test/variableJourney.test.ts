import assert from 'assert';
import * as vscode from 'vscode';
import { VariableJourneyTracker } from '../analysis/variableJourney';
import { VariableInfo } from '../parsers/types';

suite('Variable Journey Test Suite', () => {
  test('Should track variable journey correctly', () => {
    // Create mock variable data
    const mockVariable: VariableInfo = {
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
        { line: 2, character: 10, context: 'console.log(testVar);' },
      ],
    };

    // Create mock document
    const mockDocument = {
      getText: () => 'const testVar = "test";\nconsole.log(testVar);',
      positionAt: (offset: number) => {
        if (offset < 22) {
          return new vscode.Position(0, offset);
        } else {
          return new vscode.Position(1, offset - 22);
        }
      },
      fileName: '/test/file.js',
    } as vscode.TextDocument;

    // Track the variable journey
    const journey = VariableJourneyTracker.trackVariableJourney(
      mockDocument,
      mockVariable
    );

    // Verify the results
    assert.strictEqual(journey.variableName, 'testVar');
    assert.ok(journey.events.length > 0);
    assert.ok(journey.timeline.length > 0);

    // Check that we have a declaration event
    const declarationEvent = journey.events.find(e => e.type === 'declaration');
    assert.ok(declarationEvent);
    assert.strictEqual(declarationEvent?.line, 1);
  });

  test('Should generate timeline correctly', () => {
    // Create mock events
    const mockEvents = [
      {
        type: 'declaration' as const,
        line: 1,
        character: 1,
        value: '"test"',
        context: 'const testVar = "test";',
      },
      {
        type: 'reference' as const,
        line: 2,
        character: 10,
        context: 'console.log(testVar);',
      },
    ];

    // Generate timeline using internal method (we'll test the public interface)
    // const journey = {
    //   variableName: 'testVar',
    //   events: mockEvents,
    //   timeline: '',
    // };

    // Generate timeline
    const timeline = (VariableJourneyTracker as any).generateTimeline(
      mockEvents
    );

    // Verify the timeline contains expected information
    assert(timeline.includes('Line 1: Declared'));
    assert(timeline.includes('Line 2: Referenced'));
    assert(timeline.includes('const testVar = "test";'));
    assert(timeline.includes('console.log(testVar);'));
  });
});
