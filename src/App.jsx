import React, { useState } from 'react';
import PromptInput from './components/PromptInput';
import AnalysisResults from './components/AnalysisResults';
import DeepAnalysisResults from './components/DeepAnalysisResults';
import { analyzePrompt, MODEL_LIMITS } from './utils/analyzer';
import { performDeepAnalysis, fetchAvailableModels } from './utils/semanticAnalyzer';
import { Sparkles, Brain } from 'lucide-react';

function App() {
  const [promptText, setPromptText] = useState('');
  const [selectedModel, setSelectedModel] = useState('default');
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState('gemini-2.5-pro');

  const [results, setResults] = useState(null);

  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [deepResults, setDeepResults] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = () => {
    const analysis = analyzePrompt(promptText, selectedModel);
    setResults(analysis);
    // Reset deep results when main analysis runs to encourage re-scan if changed
    setDeepResults(null);
    setError(null);
  };

  const handleDeepScan = async () => {
    if (!promptText) return;
    setIsDeepAnalyzing(true);
    setError(null);
    try {
      const deepData = await performDeepAnalysis(promptText, apiKey, modelId);
      setDeepResults(deepData);
    } catch (err) {
      console.error("Deep scan failed", err);
      setError(err.message || "Deep analysis failed. Check console.");
    } finally {
      setIsDeepAnalyzing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem', width: '100%' }}>
      <header style={{ marginBottom: '3rem', marginTop: '2rem', textAlign: 'center' }}>
        <h1 className="title-gradient" style={{ fontSize: '3rem', fontWeight: 800, margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Sparkles /> Context Checker
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Optimize your agent prompts with guideline-based scoring.
        </p>
      </header>

      <main>
        <PromptInput
          value={promptText}
          onChange={setPromptText}
          onAnalyze={handleAnalyze}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          models={MODEL_LIMITS}
        />

        <AnalysisResults results={results} />

        {results && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            {!deepResults && !isDeepAnalyzing && (
              <button
                className="btn-primary"
                onClick={handleDeepScan}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Brain size={18} /> Run Deep Semantic Analysis
              </button>
            )}

            {!deepResults && !isDeepAnalyzing && (
              <div style={{ marginTop: '1rem' }}>
                <input
                  type="password"
                  placeholder="Enter Google Gemini API Key (Optional)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #4ade80',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    color: '#fff',
                    width: '300px',
                    textAlign: 'center',
                    fontSize: '0.8rem'
                  }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Leave empty to use Mock Mode. Key is never saved.
                </div>

                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Model:</label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    style={{
                      background: '#1f2937',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      color: '#fff',
                      width: '180px',
                      fontSize: '0.8rem',
                      appearance: 'auto'
                    }}
                  >
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-1.5-flash-8b">gemini-1.5-flash-8b</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    <option value="gemini-1.5-pro-002">gemini-1.5-pro-002</option>
                    <option value="gemini-1.0-pro">gemini-1.0-pro</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                  </select>
                </div>
              </div>
            )}


            {isDeepAnalyzing && (
              <div style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                Analyzing semantics with AI...
              </div>
            )}

            {error && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--error)',
                borderRadius: '8px',
                color: 'var(--error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <span>⚠️ {error}</span>
              </div>
            )}
          </div>
        )}

        <DeepAnalysisResults results={deepResults} onClose={() => setDeepResults(null)} />
      </main>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.6 }}>
        <p>Based on "Agent Skills for Context Engineering" Guidelines</p>
      </footer>
    </div>
  );
}

export default App;
