import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, Code } from 'lucide-react';

const SeverityIcon = ({ severity }) => {
    switch (severity) {
        case 'high': return <XCircle color="var(--error)" />;
        case 'medium': return <AlertTriangle color="var(--warning)" />;
        case 'low': return <Info color="#60a5fa" />;
        default: return <Info />;
    }
};

const AnalysisResults = ({ results }) => {
    if (!results) return null;

    const { score, issues, goodPoints, stats } = results;

    let scoreColor = 'var(--success)';
    if (score < 50) scoreColor = 'var(--error)';
    else if (score < 80) scoreColor = 'var(--warning)';

    return (
        <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Analysis Results</h2>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: scoreColor }}>{score}/100</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {stats.tokenCount} tokens (~{stats.charCount} chars)
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {issues.length > 0 && (
                    <div>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                            Recommendations ({issues.length})
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
                            {issues.map((issue, idx) => (
                                <li key={idx} style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'flex-start',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ marginTop: '2px' }}><SeverityIcon severity={issue.severity} /></div>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>{issue.category}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: issue.example ? '1rem' : '0' }}>{issue.text}</div>

                                        {issue.example && (
                                            <div style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                borderRadius: '8px',
                                                padding: '1rem',
                                                fontSize: '0.85rem',
                                                fontFamily: 'monospace',
                                                color: '#a5b4fc',
                                                borderLeft: '4px solid #6366f1'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#818cf8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                                    <Code size={12} /> Example
                                                </div>
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{issue.example}</pre>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {goodPoints.length > 0 && (
                    <div>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                            Good Practices ({goodPoints.length})
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
                            {goodPoints.map((point, idx) => (
                                <li key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#cbd5e1' }}>
                                    <CheckCircle size={16} color="var(--success)" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {issues.length === 0 && goodPoints.length === 0 && (
                    <p style={{ color: 'var(--text-secondary)' }}>Enter a prompt to see analysis.</p>
                )}
            </div>

            {results.recommendedPrompt && (
                <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                        Recommended Prompt Structure
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

export default AnalysisResults;
