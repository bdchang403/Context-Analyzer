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

const AnalysisResults = ({ results, inputPrompt }) => {
    const [viewMode, setViewMode] = React.useState('formatted'); // 'formatted' | 'json'

    if (!results) return null;

    const { score, issues, goodPoints, stats } = results;

    let scoreColor = 'var(--success)';
    if (score < 50) scoreColor = 'var(--error)';
    else if (score < 80) scoreColor = 'var(--warning)';

    // Construct Vertex AI Payload
    // If the input is unstructured, wrap it in a template to guide the user (as per "outlined results")
    let structuredText = inputPrompt || "";
    // Simple check: if it lacks major XML tags, apply template structure
    if (structuredText && !structuredText.includes("<GOAL>") && !structuredText.includes("<INSTRUCTIONS>")) {
        structuredText = `<GOAL>\n${inputPrompt}\n</GOAL>\n\n<CONTEXT>\n  [Background Information]\n</CONTEXT>\n\n<INSTRUCTIONS>\n  - [ ] Step 1\n  - [ ] Step 2\n</INSTRUCTIONS>`;
    }

    const vertexPayload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    { "text": structuredText }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 1,
            "topK": 64,
            "topP": 0.95,
            "maxOutputTokens": 8192,
            "responseMimeType": "text/plain"
        }
    };

    return (
        <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Analysis Results</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '8px' }}>
                        <button
                            onClick={() => setViewMode('formatted')}
                            style={{
                                background: viewMode === 'formatted' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                border: 'none',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            Formatted
                        </button>
                        <button
                            onClick={() => setViewMode('json')}
                            style={{
                                background: viewMode === 'json' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                border: 'none',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            JSON
                        </button>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: scoreColor }}>{score}/100</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {stats.tokenCount} tokens (~{stats.charCount} chars)
                        </div>
                    </div>
                </div>
            </div>

            {viewMode === 'json' ? (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', overflow: 'auto' }}>
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        Ready-to-use Vertex AI API Payload (based on your input)
                    </div>
                    <pre style={{ margin: 0, fontSize: '0.85rem', color: '#a5b4fc', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(vertexPayload, null, 2)}
                    </pre>
                </div>
            ) : (
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
            )}
        </div>
    );
};

export default AnalysisResults;
