import { describe, it, expect } from 'vitest';
import { performDeepAnalysis } from './semanticAnalyzer';

describe('Deep Semantic Analyzer (Mock)', () => {
    it('should return a valid analysis object', async () => {
        const result = await performDeepAnalysis("Analyze this prompt for me.");

        expect(result).toHaveProperty('ambiguityScore');
        expect(result).toHaveProperty('safetyScore');
        expect(result).toHaveProperty('contradictions');
        expect(result).toHaveProperty('suggestions');
        expect(result).toHaveProperty('thoughts');

        expect(typeof result.ambiguityScore).toBe('number');
        expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should detect simulated contradiction', async () => {
        const result = await performDeepAnalysis("You should always do this but never do that.");
        expect(result.contradictions.length).toBeGreaterThan(0);
        expect(result.contradictions[0]).toContain('Contradiction found');
    });
});
