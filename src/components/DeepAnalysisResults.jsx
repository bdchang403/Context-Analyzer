import React from 'react';
import { Brain, Shield, Zap, AlertOctagon, Lightbulb, FileText, HelpCircle } from 'lucide-react';

const DeepAnalysisResults = ({ results, inputPrompt, onClose }) => {
    const [viewMode, setViewMode] = React.useState('formatted'); // 'formatted' | 'json'
    const [sdkFormat, setSdkFormat] = React.useState('vertex'); // 'vertex' | 'openai' | 'anthropic'
    const [activeTooltip, setActiveTooltip] = React.useState(null); // 'ambiguity' | 'safety' | null

    const AMBIGUITY_RUBRIC = [
        "1. Crystal Clear: Atomic, definitions provided.",
        "2. Clear: Most terms defined, actionable.",
        "3. Moderate: Some vague terms without constraints.",
        "4. Vague: Multiple interpretations possible.",
        "5. Highly Ambiguous: Open-ended, no context."
    ];

    const SAFETY_RUBRIC = [
        "1. Unsafe: Violates core safety policies.",
        "2. Risky: Borderline content, potential jailbreak.",
        "3. Neutral: Lacks positive safety constraints.",
        "4. Safe: Benign topic, no apparent risks.",
        "5. Very Safe: Includes explicit safety constraints."
    ];

    if (!results) return null;

    const { ambiguityScore, safetyScore, contradictions, suggestions, clarifyingQuestions, thoughts } = results;

    const getScoreColor = (score, type) => {
        if (type === 'ambiguity') return score > 3 ? 'var(--warning)' : 'var(--success)';
        if (type === 'safety') return score < 3 ? 'var(--error)' : 'var(--success)';
        return 'var(--text-primary)';
    };

    // Construct Payload Logic
    const getPayload = () => {
        // Use recommended prompt if available, otherwise original input
        const finalPrompt = results.recommendedPrompt || inputPrompt || "";

        switch (sdkFormat) {
            case 'openai':
                return {
                    "model": "gpt-4o",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful assistant."
                        },
                        {
                            "role": "user",
                            "content": finalPrompt
                        }
                    ],
                    "temperature": 1,
                    "max_tokens": 4096,
                    "top_p": 1
                };
            case 'anthropic':
                return {
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 8192,
                    "messages": [
                        {
                            "role": "user",
                            "content": finalPrompt
                        }
                    ]
                };
            case 'vertex':
            default:
                return {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                { "text": finalPrompt }
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
        }
    };

    const currentPayload = getPayload();

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
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: '1rem' }}
                    >
                        Close
                    </button>
                </div>
            </div>

            {viewMode === 'json' ? (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', overflow: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Ready-to-use API Payload ({results.recommendedPrompt ? "Optimized" : "Original"})
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['vertex', 'openai', 'anthropic'].map(fmt => (
                                <button
                                    key={fmt}
                                    onClick={() => setSdkFormat(fmt)}
                                    style={{
                                        background: sdkFormat === fmt ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        color: 'white',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {fmt === 'vertex' ? 'Google / Vertex' : fmt}
                                </button>
                            ))}
                        </div>
                    </div>
                    <pre style={{ margin: 0, fontSize: '0.85rem', color: '#a5b4fc', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(currentPayload, null, 2)}
                    </pre>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', position: 'relative' }}>
                            <div
                                style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                onMouseEnter={() => setActiveTooltip('ambiguity')}
                                onMouseLeave={() => setActiveTooltip(null)}
                            >
                                Ambiguity Score <HelpCircle size={14} />
                            </div>
                            {activeTooltip === 'ambiguity' && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#1f2937',
                                    border: '1px solid #4b5563',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    zIndex: 10,
                                    width: '250px',
                                    textAlign: 'left',
                                    fontSize: '0.75rem',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                }}>
                                    <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Ambiguity Rubric (1-5)</strong>
                                    {AMBIGUITY_RUBRIC.map((r, i) => (
                                        <div key={i} style={{ marginBottom: '0.25rem', color: '#d1d5db' }}>{r}</div>
                                    ))}
                                </div>
                            )}
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: getScoreColor(ambiguityScore, 'ambiguity') }}>
                                {ambiguityScore}/5
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>{ambiguityScore > 3 ? 'Vague' : 'Clear'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.2' }}>
                                {results.ambiguityReasoning || "No reasoning provided."}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', position: 'relative' }}>
                            <div
                                style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                onMouseEnter={() => setActiveTooltip('safety')}
                                onMouseLeave={() => setActiveTooltip(null)}
                            >
                                Safety Score <HelpCircle size={14} />
                            </div>
                            {activeTooltip === 'safety' && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#1f2937',
                                    border: '1px solid #4b5563',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    zIndex: 10,
                                    width: '250px',
                                    textAlign: 'left',
                                    fontSize: '0.75rem',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                }}>
                                    <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Safety Rubric (1-5)</strong>
                                    {SAFETY_RUBRIC.map((r, i) => (
                                        <div key={i} style={{ marginBottom: '0.25rem', color: '#d1d5db' }}>{r}</div>
                                    ))}
                                </div>
                            )}
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

                    {clarifyingQuestions && clarifyingQuestions.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fda4af' }}>
                                <HelpCircle size={16} /> Clarifying Questions
                            </h3>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
                                {clarifyingQuestions.map((q, i) => (
                                    <li key={i} style={{
                                        background: 'rgba(190, 24, 93, 0.2)',
                                        borderLeft: '3px solid #f472b6',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '0 8px 8px 0',
                                        fontSize: '0.9rem',
                                        color: '#fbcfe8'
                                    }}>
                                        {q}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

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
                </>
            )}
        </div>
    );
};

export default DeepAnalysisResults;
