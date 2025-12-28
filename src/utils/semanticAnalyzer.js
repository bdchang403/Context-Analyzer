/**
 * Deep Semantic Analysis (LLM-as-a-Judge).
 * Supports both Mock mode (for testing) and Real mode (Gemini API).
 */
export const performDeepAnalysis = async (prompt, apiKey = null, modelId = 'gemini-1.5-flash') => {
    // 1. MOCK MODE (Default if no key)
    if (!apiKey) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const isShort = prompt.length < 50;
                const hasContradiction = prompt.toLowerCase().includes("always") && prompt.toLowerCase().includes("never");

                resolve({
                    ambiguityScore: isShort ? 4 : 2,
                    ambiguityReasoning: isShort ? "The prompt is too short to fully grasp the intent, leaving key constraints undefined." : "Most terms are well-defined, though 'appropriately' is subjective.",
                    safetyScore: 5,
                    safetyReasoning: "The prompt does not venture into any dangerous or sensitive topics.",
                    contradictions: hasContradiction ?
                        ["Contradiction found: You used terms 'always' and 'never' which might conflict contextually."] : [],
                    suggestions: [
                        "Clarify the 'persona' tone. You mentioned 'professional' but the prompt uses slang.",
                        "Define 'success constraints' more explicitly. What happens if the agent fails?",
                        "Consider adding a 'negative constraint' (e.g., 'Do not use emojis')."
                    ],
                    thoughts: "The prompt defines a clear goal but lacks error handling instructions. The user uses vague terms like 'appropriately' which could lead to inconsistent outputs. (MOCK ANALYSIS)",
                    recommendedPrompt: `<!-- RECOMMENDED PROMPT STRUCTURE -->
<GOAL>
  [Refined Goal based on your input]
</GOAL>

<CONTEXT>
  ${prompt}
</CONTEXT>

<INSTRUCTIONS>
  - [ ] Specific Action 1
  - [ ] Specific Action 2
  - CRITICAL: Use the persona defined in context.
</INSTRUCTIONS>

<OUTPUT_FORMAT>
  Markdown
</OUTPUT_FORMAT>`
                });
            }, 1000);
        });
    }

    // 2. REAL MODE (Gemini API)
    try {
        return await callGeminiAPI(prompt, apiKey, modelId);
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error; // Re-throw exact error message from callGeminiAPI
    }
};

const callGeminiAPI = async (userPrompt, key, modelId) => {
    const SYSTEM_PROMPT = `
    You are an expert Evaluator Agent acting as a 'Judge' for prompt engineering quality.
    Your goal is to assess the user's prompt for clarity, safety, and effectiveness, AND to rewrite it into a highly structured, effective prompt.

    Analyze the user's prompt and return ONLY a JSON object with this exact structure:
    {
        "ambiguityScore": <number 1-5>,
        "ambiguityReasoning": "<string, one sentence justifying the score>",
        "safetyScore": <number 1-5>,
        "safetyReasoning": "<string, one sentence justifying the score>",
        "contradictions": [<array of strings describing logical conflicts found>],
        "suggestions": [<array of strings with specific, actionable improvements>],
        "thoughts": "<string, your brief reasoning>",
        "recommendedPrompt": "<string, the rewritten optimized prompt using the XML structure below>"
    }

    ### Recommended Prompt Structure (for the 'recommendedPrompt' field)
    Rewrite the user's prompt into this format. Use the XML tags EXACTLY.
    
    \`\`\`xml
    <!-- RECOMMENDED PROMPT STRUCTURE -->
    <GOAL>
      [Clear statement of the objective. Put this FIRST.]
    </GOAL>

    <CONTEXT>
      [Relevant background info from the user's prompt. If none, ask for it.]
    </CONTEXT>

    <INSTRUCTIONS>
      - [ ] [Specific task 1]
      - [ ] [Specific task 2]
      - CRITICAL: [Safety or constraint 1]
    </INSTRUCTIONS>

    <OUTPUT_FORMAT>
      [Output requirements, e.g. JSON, Markdown, etc.]
    </OUTPUT_FORMAT>
    
    <!-- REFINEMENT PLAN -->
    <!-- check: Is "Goal" at the start? Is the prompt concise? -->
    \`\`\`

    ### Context Engineering Rubrics
    ... (Rubrics remain the same) ...
    
    ### Evaluation Guidelines
    -   **Be Objective**: Score based strictly on the rubrics above.
    -   **Actionable Suggestions**: Do not say "Make it better". Say "Define 'short' as specific word count (e.g., < 100 words)."
    -   **Recommended Prompt**: This MUST be a valid string in the JSON. Escape newlines and quotes properly if needed, but since this is a JSON response, the model usually handles specific escaping. prefer using \\n for newlines within the string.
    `;

    // Ensure modelId doesn't have 'models/' prefix if user typed it
    const cleanModelId = modelId.replace('models/', '');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cleanModelId}:generateContent?key=${key}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: SYSTEM_PROMPT + "\n\nAnalyze this prompt:\n" + userPrompt }]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const err = await response.json();
        const msg = err.error?.message || "API Request Failed";
        throw new Error(`Gemini API Error: ${msg}`);
    }

    const data = await response.json();
    try {
        const text = data.candidates[0].content.parts[0].text;
        return JSON.parse(text);
    } catch (e) {
        throw new Error("Failed to parse Gemini response: " + e.message);
    }
};

export const fetchAvailableModels = async (apiKey) => {
    if (!apiKey) throw new Error("API Key required");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Failed to list models");
    }

    const data = await response.json();
    return data.models || [];
};
