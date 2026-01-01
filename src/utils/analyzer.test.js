import { describe, it, expect } from 'vitest';
import { analyzePrompt } from './analyzer';

/* ==========================================================================
   TEST DATA
   ========================================================================== */

const PROMPTS = {
    ORCHESTRATOR_MARKDOWN: `# Workflow Orchestrator

You are a workflow orchestration expert managing a team of specialized AI agents.

## Your Role

- Analyze complex tasks and decompose them into subtasks
- Assign subtasks to the most appropriate agents
- Coordinate outputs and manage dependencies

## Available Agents

### Evaluator Agent
**Capabilities**: Quality assessment, scoring, pairwise comparison
**Use when**: Need to assess response quality, compare outputs, validate content

## Task Template

When delegating to an agent, provide:

\`\`\`
Agent: [agent_name]
Task: [clear description of what to do]
\`\`\`
`,

    DIRECT_SCORING_XML: `# Direct Scoring Evaluation

You are an expert evaluator assessing the quality of an AI-generated response.

## Your Task

Evaluate the response below against the specified criteria.

## Original Prompt/Task

<task>
{{original_prompt}}
</task>

{{#if context}}
## Additional Context

<context>
{{context}}
</context>
{{/if}}
`,

    BAD_STRUCTURE: `
I want you to be a coding assistant. Help me write python code. 
Also invoke the search tool if you need to. 
Just write the code and don't say anything else.
`,

    SHORT_PROMPT: "test",
    SHORT_BUT_LONG_ENOUGH: "I want you to be a coding assistant. Help me write python code. Also invoke the search tool if you need to.",

    UNSTRUCTURED: "This is just a block of text without any clear structure. It is deliberately written to be unstructured but long enough to pass the low context check.",

    LONG_20K_TOKENS: "a".repeat(80000),   // ~20k tokens
    VERY_LONG_100K_TOKENS: "a".repeat(400000) // ~100k tokens
};

/* ==========================================================================
   TEST SUITE
   ========================================================================== */

describe('Prompt Analyzer', () => {

    describe('1. Structure & Clarity Checks', () => {

        it('should recognize and reward Markdown headers', () => {
            const result = analyzePrompt(PROMPTS.ORCHESTRATOR_MARKDOWN);

            expect(result.score, 'Score should be high for well-structured Markdown').toBeGreaterThan(60);
            expect(result.goodPoints.some(p => p.includes("Markdown headers"))).toBe(true);
        });

        it('should recognize and reward XML tags', () => {
            const result = analyzePrompt(PROMPTS.DIRECT_SCORING_XML);

            expect(result.score, 'Score should be high for well-structured XML').toBeGreaterThan(60);
            expect(result.goodPoints.some(p => p.includes("XML tags"))).toBe(true);
        });

        it('should penalize unstructured prompts', () => {
            const result = analyzePrompt(PROMPTS.BAD_STRUCTURE);

            expect(result.score, 'Score should be low for unstructured text').toBeLessThan(100);
            expect(result.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ category: 'Structure' })
                ])
            );
        });
    });

    describe('2. Recommendation Features', () => {

        it('should provide code examples for identified issues', () => {
            const result = analyzePrompt(PROMPTS.UNSTRUCTURED);

            // Structure Issue Check
            const structureIssue = result.issues.find(i => i.category === 'Structure');
            expect(structureIssue, 'Should find a Structure issue').toBeDefined();
            expect(structureIssue.example, 'Structure issue should have an example').toContain('<INSTRUCTIONS>');

            // Clarity Issue Check
            const clarityIssue = result.issues.find(i => i.category === 'Clarity');
            expect(clarityIssue, 'Should find a Clarity issue').toBeDefined();
            expect(clarityIssue.example, 'Clarity issue should have an example').toContain('Goal:');
        });
    });

    describe('4. Low Context Checks', () => {

        it('should heavily penalize extremely short prompts (< 20 tokens)', () => {
            // "test" is very short
            const result = analyzePrompt(PROMPTS.SHORT_PROMPT);

            // Expected: 100 - 30 (low context) - 20 (structure) - 10 (goal) - 10 (example) = 30
            expect(result.score, 'Score should be very low for "test"').toBeLessThan(50);
            expect(result.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ category: 'Clarity', severity: 'high', text: expect.stringContaining('too short') })
                ])
            );
        });

        it('should NOT penalize poorly constructed but sufficient length prompts with "Low Context"', () => {
            const result = analyzePrompt(PROMPTS.BAD_STRUCTURE);
            // This prompt is > 20 tokens, so no "Low Context" penalty.
            // Expected: 100 - 20 (structure) - 10 (goal) - 10 (example) = 60

            const lowContextIssue = result.issues.find(i => i.text.includes('too short'));
            expect(lowContextIssue, 'Should NOT find a Low Context issue').toBeUndefined();

            expect(result.score, 'Score should be mediocre (around 60) but not failing (<40)').toBeGreaterThan(40);
        });
    });

    describe('3. Degradation & Model Limits', () => {

        describe('Default Model (Generic)', () => {
            it('should warn about degradtion at 20k tokens', () => {
                const result = analyzePrompt(PROMPTS.LONG_20K_TOKENS);

                // Expect medium severity warning for default model (~16k limit)
                expect(result.issues).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ category: 'Degradation', severity: 'medium' })
                    ])
                );
            });
        });

        describe('GPT 5.2 (High Capacity)', () => {
            it('should NOT warn at 20k tokens (Limit is 64k)', () => {
                const result = analyzePrompt(PROMPTS.LONG_20K_TOKENS, 'gpt-5.2');

                const degradationIssues = result.issues.filter(i => i.category === 'Degradation');
                expect(degradationIssues.length, 'Should handle 20k tokens without warning').toBe(0);
            });

            it('should warn at 100k tokens (Limit is 64k)', () => {
                const result = analyzePrompt(PROMPTS.VERY_LONG_100K_TOKENS, 'gpt-5.2');

                expect(result.issues).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ category: 'Degradation' })
                    ])
                );
            });
        });
    });

    describe('5. Preciseness & Vague Language', () => {
        it('should penalize vague phrases like "etc." and "and so on"', () => {
            const vagueText = "I want a list of fruits like apples, bananas, etc. and so on. Goal: List fruits.";
            const result = analyzePrompt(vagueText);

            expect(result.score).toBeLessThan(100);

            const precisenessIssue = result.issues.find(i => i.category === 'Preciseness');
            expect(precisenessIssue).toBeDefined();
            expect(precisenessIssue.text).toContain('"etc."');
            expect(precisenessIssue.text).toContain('"and so on"');
        });

        it('should detect "and stuff" at the end of a sentence', () => {
            const vagueText = "Goal: Just do the coding and stuff.";
            const result = analyzePrompt(vagueText);
            const issue = result.issues.find(i => i.category === 'Preciseness');
            expect(issue).toBeDefined();
            expect(issue.text).toContain('"and stuff (like that)"');
        });

        it('should detect "and things like that"', () => {
            const vagueText = "Goal: Handle errors, logging, and things like that.";
            const result = analyzePrompt(vagueText);
            const issue = result.issues.find(i => i.category === 'Preciseness');
            expect(issue).toBeDefined();
            expect(issue.text).toContain('"and things (like that)"');
        });

        it('should NOT penalize "and things" if followed by specific nouns or clauses', () => {
            // "and things matching" -> not "like that" or end of sentence
            const specificText = "Goal: Return a list of users and things matching the criteria provided.";

            const result = analyzePrompt(specificText);
            const precisenessIssue = result.issues.find(i => i.category === 'Preciseness');
            expect(precisenessIssue).toBeUndefined();
        });
    });

});
