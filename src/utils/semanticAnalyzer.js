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

                const ambiguityScore = isShort ? 4 : 2;
                const safetyScore = 5;
                const needsRecommendation = ambiguityScore > 2 || safetyScore < 4;

                const recommendedPrompt = needsRecommendation ? `<!-- RECOMMENDED PROMPT STRUCTURE -->
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
</OUTPUT_FORMAT>` : null;

                resolve({
                    ambiguityScore,
                    ambiguityReasoning: isShort ? "The prompt is too short to fully grasp the intent, leaving key constraints undefined." : "Most terms are well-defined, though 'appropriately' is subjective.",
                    safetyScore,
                    safetyReasoning: "The prompt does not venture into any dangerous or sensitive topics.",
                    contradictions: hasContradiction ?
                        ["Contradiction found: You used terms 'always' and 'never' which might conflict contextually."] : [],
                    suggestions: [
                        "Clarify the 'persona' tone. You mentioned 'professional' but the prompt uses slang.",
                        "Define 'success constraints' more explicitly. What happens if the agent fails?",
                        "Consider adding a 'negative constraint' (e.g., 'Do not use emojis')."
                    ],
                    thoughts: "The prompt defines a clear goal but lacks error handling instructions. The user uses vague terms like 'appropriately' which could lead to inconsistent outputs. (MOCK ANALYSIS)",
                    recommendedPrompt
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
        "recommendedPrompt": "<string OR null, see 'Conditional Recommendation' below>"
    }

    ### Conditional Recommendation
    - You MUST return 'null' for the 'recommendedPrompt' field if:
      1. The 'ambiguityScore' is 1 or 2 (Very Clear/Clear).
      2. AND the 'safetyScore' is 4 or 5 (Safe/Very Safe).
      3. OR if the user's prompt is already well-structured and your recommendation would be nearly identical.
    - Otherwise, provide the rewritten prompt using the XML structure below.

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
    **Ambiguity Score (1-5):**
    1.  **Crystal Clear**: Atomic, well-constrained, definitions provided for all key terms. No room for misinterpretation.
    2.  **Clear**: Most terms defined, minor broadness but generally actionable.
    3.  **Moderate**: Some vague terms (e.g., "short", "interesting") without constraints. Requires some model assumption.
    4.  **Vague**: Multiple interpretations possible. Missing key constraints (time, scope, format).
    5.  **Highly Ambiguous**: Distinct lack of specific instructions, totally open-ended without context.

    **Safety Score (1-5):**
    (1 = EXTREMELY UNSAFE, 5 = EXTREMELY SAFE)
    1.  **Unsafe**: Violates core safety policies (hate speech, dangerous content, PII).
    2.  **Risky**: Borderline content, potential jailbreak attempts or controversial topics without guardrails.
    3.  **Neutral**: Not explicitly harmful but lacks positive safety constraints for sensitive topics.
    4.  **Safe**: Benign topic, no apparent risks.
    5.  **Very Safe**: Includes explicit safety constraints (e.g., "Do not reveal PII", "Maintain neutral tone").
    
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
