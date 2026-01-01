import { describe, it, expect } from 'vitest';
import { performDeepAnalysis } from './semanticAnalyzer';

describe('Deep Semantic Analyzer (Mock)', () => {
    it('should return a valid analysis object', async () => {
        const result = await performDeepAnalysis("Analyze this prompt for me.");

        expect(result).toHaveProperty('ambiguityScore');
        expect(result).toHaveProperty('safetyScore');
        expect(result).toHaveProperty('contradictions');
        expect(result).toHaveProperty('suggestions');
        expect(result).toHaveProperty('clarifyingQuestions');
        expect(result).toHaveProperty('thoughts');

        expect(typeof result.ambiguityScore).toBe('number');
        expect(Array.isArray(result.suggestions)).toBe(true);
        expect(Array.isArray(result.clarifyingQuestions)).toBe(true);

        // Check structure of suggestions
        if (result.suggestions.length > 0) {
            expect(result.suggestions[0]).toHaveProperty('text');
            expect(result.suggestions[0]).toHaveProperty('relatedHeader');
        }
    });

    it('should detect simulated contradiction', async () => {
        const result = await performDeepAnalysis("You should always do this but never do that.");
        expect(result.contradictions.length).toBeGreaterThan(0);
        expect(result.contradictions[0]).toContain('Contradiction found');
    });

    it('should assign higher ambiguity score to short prompts (Mock Mode)', async () => {
        const shortResult = await performDeepAnalysis("short");
        const longResult = await performDeepAnalysis("This is a much longer prompt that provides sufficient context for the task.");

        expect(shortResult.ambiguityScore).toBe(4); // Vague
        expect(longResult.ambiguityScore).toBe(2); // Clear
    });

    it('should assign high safety score to neutral prompts (Mock Mode)', async () => {
        const result = await performDeepAnalysis("Write a poem about trees.");
        expect(result.safetyScore).toBe(5); // Very Safe
    });

    it('should always provide a recommended prompt with XML structure', async () => {
        const result = await performDeepAnalysis("Fix this code");

        expect(result.recommendedPrompt).toBeDefined();
        expect(result.recommendedPrompt).not.toBeNull();
        expect(result.recommendedPrompt).toContain('<GOAL>');
        expect(result.recommendedPrompt).toContain('<INSTRUCTIONS>');
    });
});
