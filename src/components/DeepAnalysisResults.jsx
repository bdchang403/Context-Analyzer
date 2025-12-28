import React from 'react';
import { Brain, Shield, Zap, AlertOctagon, Lightbulb, FileText } from 'lucide-react';

const DeepAnalysisResults = ({ results, onClose }) => {
    if (!results) return null;

    const { ambiguityScore, safetyScore, contradictions, suggestions, thoughts } = results;

    const getScoreColor = (score, type) => {
        if (type === 'ambiguity') return score > 3 ? 'var(--warning)' : 'var(--success)';
        if (type === 'safety') return score < 3 ? 'var(--error)' : 'var(--success)';
        return 'var(--text-primary)';
    };

    return (
        <div className="glass-card" style={{
            padding: '2rem',
            marginTop: '2rem',
            border: '1px solid #8b5cf6',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Brain color="#8b5cf6" /> Deep Semantic Analysis
                </h2>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                    Close
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Ambiguity Score</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: getScoreColor(ambiguityScore, 'ambiguity') }}>
                        {ambiguityScore}/5
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>{ambiguityScore > 3 ? 'Vague' : 'Clear'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.2' }}>
                        {results.ambiguityReasoning || "No reasoning provided."}
                    </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Safety Score</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: getScoreColor(safetyScore, 'safety') }}>
                        {safetyScore}/5
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>{safetyScore < 3 ? 'Risky' : 'Safe'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.2' }}>
                        {results.safetyReasoning || "No reasoning provided."}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={16} color="#fcd34d" /> AI Thought Process
                </h3>
                <div style={{
                    fontStyle: 'italic',
                    color: 'var(--text-secondary)',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '1rem',
                    borderRadius: '8px',
                    lineHeight: 1.6
                }}>
                    "{thoughts}"
                </div>
            </div>

            {contradictions.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)' }}>
                        <AlertOctagon size={16} /> Contradictions Detected
                    </h3>
                    <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-primary)' }}>
                        {contradictions.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                </div>
            )}

            <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa' }}>
                    <Lightbulb size={16} /> Semantic Suggestions
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
                    {suggestions.map((s, i) => (
                        <li key={i} style={{
                            background: 'rgba(30, 58, 138, 0.2)',
                            borderLeft: '3px solid #60a5fa',
                            padding: '0.75rem 1rem',
                            borderRadius: '0 8px 8px 0',
                            fontSize: '0.9rem'
                        }}>
                            {s}
                        </li>
                    ))}
                </ul>
            </div>

            {results.recommendedPrompt && (
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                        <FileText size={16} /> Recommended Prompt Structure
                    </h3>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        padding: '1rem',
                        overflowX: 'auto'
                    }}>
                        <pre style={{
                            margin: 0,
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            color: '#d1d5db',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {results.recommendedPrompt}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeepAnalysisResults;
