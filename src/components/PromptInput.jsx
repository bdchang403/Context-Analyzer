import React from 'react';

const PromptInput = ({ value, onChange, onAnalyze, selectedModel, onModelChange, models }) => {
    return (
        <div className="glass-card p-6" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Input Prompt</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="model-select" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Target Model:</label>
                    <select
                        id="model-select"
                        value={selectedModel}
                        onChange={(e) => onModelChange(e.target.value)}
                        style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {Object.entries(models || {}).map(([key, data]) => (
                            <option key={key} value={key}>{data.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <textarea
                placeholder="Paste your system prompt or agent instructions here..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={onAnalyze}>
                    Check Prompt
                </button>
            </div>
        </div>
    );
};

export default PromptInput;
