// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import AnalysisResults from './AnalysisResults';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Sparkles: () => <div data-testid="icon-sparkles">Sparkles</div>,
    AlertCircle: () => <div data-testid="icon-alert">Alert</div>,
    CheckCircle: () => <div data-testid="icon-check">Check</div>,
    Info: () => <div data-testid="icon-info">Info</div>,
    Copy: () => <div data-testid="icon-copy">Copy</div>,
    Check: () => <div data-testid="icon-check-simple">CheckSimple</div>,
    AlertTriangle: () => <div data-testid="icon-alert-triangle">AlertTriangle</div>
}));

// Force cleanup
afterEach(() => {
    cleanup();
});

describe('AnalysisResults Component', () => {
    const mockResults = {
        score: 80,
        issues: [{ category: 'Clarity', text: 'Issue 1', severity: 'medium' }],
        goodPoints: ['Good Point 1'],
        stats: { tokenCount: 100, charCount: 500 }
    };
    const inputPrompt = "Simple test prompt";

    it('renders formatted view by default', () => {
        render(<AnalysisResults results={mockResults} inputPrompt={inputPrompt} />);
        expect(screen.getByText('Analysis Results')).toBeDefined();
        expect(screen.getByText(/80/)).toBeDefined();
    });

    it('toggles to JSON view and shows Vertex payload by default', async () => {
        const { container } = render(<AnalysisResults results={mockResults} inputPrompt={inputPrompt} />);

        const buttons = screen.getAllByRole('button', { name: 'JSON' });
        fireEvent.click(buttons[0]);

        await waitFor(() => {
            const preContent = container.querySelector('pre');
            expect(preContent).not.toBeNull();
            expect(preContent.textContent).toContain('"contents"');
        });
    });

    it('switches JSON payload when SDK buttons are clicked', async () => {
        const { container } = render(<AnalysisResults results={mockResults} inputPrompt={inputPrompt} />);

        const buttons = screen.getAllByRole('button', { name: 'JSON' });
        fireEvent.click(buttons[0]);

        // Wait for JSON view
        await waitFor(() => container.querySelector('pre'));

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
});
