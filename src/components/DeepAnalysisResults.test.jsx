// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import DeepAnalysisResults from './DeepAnalysisResults';

// Mock Lucide icons... (keep same)
vi.mock('lucide-react', () => ({
    Brain: () => <div data-testid="icon-brain">Brain</div>,
    Shield: () => <div data-testid="icon-shield">Shield</div>,
    Zap: () => <div data-testid="icon-zap">Zap</div>,
    AlertOctagon: () => <div data-testid="icon-alert">Alert</div>,
    Lightbulb: () => <div data-testid="icon-lightbulb">Lightbulb</div>,
    FileText: () => <div data-testid="icon-filetext">FileText</div>,
    HelpCircle: () => <div data-testid="icon-help">HelpCircle</div>
}));

// Force cleanup after each test
afterEach(() => {
    cleanup();
});

describe('DeepAnalysisResults Component', () => {
    const mockResults = {
        ambiguityScore: 5,
        safetyScore: 3,
        ambiguityReasoning: "Ambiguity Reasoning",
        safetyReasoning: "Safety Reasoning",
        contradictions: ["Contradiction 1"],
        suggestions: [{ text: "Suggestion 1", relatedHeader: "<INSTRUCTIONS>" }],
        clarifyingQuestions: [{ text: "Question 1", relatedHeader: "<GOAL>" }],
        thoughts: "AI Thoughts",
        recommendedPrompt: "<GOAL>Test Goal</GOAL>" // Structured prompt
    };

    const inputPrompt = "Test Input Prompt";
    const onClose = vi.fn();

    it('renders formatted view by default', () => {
        render(<DeepAnalysisResults results={mockResults} inputPrompt={inputPrompt} onClose={onClose} />);
        expect(screen.getByText('Deep Semantic Analysis')).toBeDefined();
        expect(screen.getByText('Ambiguity Score')).toBeDefined(); // Assuming unique
    });

    it('renders clarifying questions when present', () => {
        render(<DeepAnalysisResults results={mockResults} inputPrompt={inputPrompt} onClose={onClose} />);
        expect(screen.getByText('Clarifying Questions')).toBeDefined();
        expect(screen.getByText('Question 1')).toBeDefined();
    });

    it('toggles to JSON view and shows Vertex payload by default', async () => {
        const user = userEvent.setup();
        const { container } = render(<DeepAnalysisResults results={mockResults} inputPrompt={inputPrompt} onClose={onClose} />);

        // Find button specifically
        const buttons = screen.getAllByRole('button', { name: 'JSON' });
        await user.click(buttons[0]);

        await waitFor(() => {
            const preContent = container.querySelector('pre');
            expect(preContent).not.toBeNull();
            expect(preContent.textContent).toContain('"contents"');
            expect(preContent.textContent).toContain('<GOAL>Test Goal</GOAL>');
        });
    });

    it('switches JSON payload when SDK buttons are clicked', async () => {
        const user = userEvent.setup();
        const { container } = render(<DeepAnalysisResults results={mockResults} inputPrompt={inputPrompt} onClose={onClose} />);

        // Go to JSON view
        const buttons = screen.getAllByRole('button', { name: 'JSON' });
        await user.click(buttons[0]);

        // Wait for JSON view to handle ref
        await waitFor(() => screen.getByText(/Ready-to-use API Payload/));

        // Click OpenAI
        fireEvent.click(screen.getByText('openai'));

        await waitFor(() => {
            const pre = container.querySelector('pre');
            expect(pre.textContent).toContain('"model": "gpt-4o"');
        });

        // Click Anthropic
        fireEvent.click(screen.getByText('anthropic'));
        await waitFor(() => {
            const pre = container.querySelector('pre');
            expect(pre.textContent).toContain('"model": "claude-3-5-sonnet-20241022"');
        });

        // Click Vertex again
        fireEvent.click(screen.getByText('Google / Vertex'));
        await waitFor(() => {
            const pre = container.querySelector('pre');
            expect(pre.textContent).toContain('"contents"');
        });
    });

    it('shows tooltips on hover', async () => {
        const user = userEvent.setup();
        render(<DeepAnalysisResults results={mockResults} inputPrompt={inputPrompt} onClose={onClose} />);

        // Use getAllByText to avoid multiple element errors
        const ambiguityInfos = screen.getAllByText(/Ambiguity Score/);
        const triggerDiv = ambiguityInfos[0].closest('div');

        await user.hover(triggerDiv);

        await waitFor(() => {
            expect(screen.getByText(/Ambiguity Rubric/)).toBeDefined();
        });

        await user.unhover(triggerDiv);

        await waitFor(() => {
            expect(screen.queryByText(/Ambiguity Rubric/)).toBeNull();
        });
    });
});
