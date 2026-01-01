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
                const lowerPrompt = prompt.toLowerCase();
                const hasContradiction = lowerPrompt.includes("always") && lowerPrompt.includes("never");
                const isComparison = lowerPrompt.includes("compare") || lowerPrompt.includes("diff") || lowerPrompt.includes("difference");

                const ambiguityScore = isShort ? 4 : 2;
                const safetyScore = 5;
                const needsRecommendation = ambiguityScore > 2 || safetyScore < 4;

                const recommendedPrompt = `<!-- RECOMMENDED PROMPT STRUCTURE -->
<GOAL>
  ${prompt || "[Goal unclear from short input]"}
</GOAL>

<CONTEXT>
  [Add background context here]
</CONTEXT>

<INSTRUCTIONS>
  - [ ] Action item 1
  - [ ] Action item 2
  - CRITICAL: [Safety constraint]
</INSTRUCTIONS>

<OUTPUT_FORMAT>
  Markdown
</OUTPUT_FORMAT>`;

                resolve({
                    ambiguityScore,
                    ambiguityReasoning: isShort ? "The prompt is too short to fully grasp the intent, leaving key constraints undefined." : "Most terms are well-defined, though 'appropriately' is subjective.",
                    safetyScore,
                    safetyReasoning: "The prompt does not venture into any dangerous or sensitive topics.",
                    contradictions: hasContradiction ?
                        ["Contradiction found: You used terms 'always' and 'never' which might conflict contextually."] : [],
                    suggestions: [
                        { text: "Clarify the 'persona' tone. You mentioned 'professional' but the prompt uses slang.", relatedHeader: "<INSTRUCTIONS>" },
                        { text: "Define 'success constraints' more explicitly. What happens if the agent fails?", relatedHeader: "<INSTRUCTIONS>" },
                        { text: "Consider adding a 'negative constraint' (e.g., 'Do not use emojis').", relatedHeader: "<INSTRUCTIONS>" }
                    ],
                    clarifyingQuestions: isComparison ? [
                        { text: "What is the relationship between the items being compared (e.g., Version 1 vs Version 2, or Product A vs Product B)?", relatedHeader: "<CONTEXT>" },
                        { text: "Are there specific dimensions of comparison you are most interested in?", relatedHeader: "<INSTRUCTIONS>" },
                        { text: "How should the differences be categorized?", relatedHeader: "<OUTPUT_FORMAT>" }
                    ] : [
                        { text: "Are you comparing two different versions of the document, or two completely different documents?", relatedHeader: "<CONTEXT>" },
                        { text: "What is the target audience for this analysis?", relatedHeader: "<GOAL>" },
                        { text: "Do you have a specific format in mind for the output?", relatedHeader: "<OUTPUT_FORMAT>" }
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

import { RESEARCH_TAGS, AGENTIC_TAGS } from './analyzer.js';

const callGeminiAPI = async (userPrompt, key, modelId) => {
    const SYSTEM_PROMPT = `
    You are an Expert Prompt Engineering Coach.
    Your goal is to coach the user on how to improve their prompt by providing specific, actionable feedback tied to specific sections of a structured prompt(e.g., GOAL, CONTEXT, INSTRUCTIONS).

    Analyze the user's prompt and return ONLY a JSON object with this exact structure:
    {
        "ambiguityScore": <number 1 - 5 >,
            "ambiguityReasoning": "<string, one sentence justifying the score>",
                "safetyScore": <number 1 - 5 >,
                    "safetyReasoning": "<string, one sentence justifying the score>",
                        "contradictions": [<array of strings describing logical conflicts found>],
                            "suggestions": [
                            {"text": "<string, actionable improvement>", "relatedHeader": "<string, e.g. <GOAL>, <CONTEXT>, <INSTRUCTIONS>, <OUTPUT_FORMAT>>" }
                                ],
                                "clarifyingQuestions": [
                                {"text": "<string, question for the user>", "relatedHeader": "<string, e.g. <GOAL>, <CONTEXT>>" }
                                    ],
                                    "thoughts": "<string, your brief reasoning>",
                                    "recommendedPrompt": "<string OR null, see 'Conditional Recommendation' below>"
    }

                                    ### Keyword-Based Trigger Logic
                                    Analyze the user's INTENT. Use these specific keys to determine the best structure:

                                    1. **Deep Research Triggers**: If the user asks for a "report", "paper", "deep dive", "comprehensive analysis", or implies the need for:
                                    [${RESEARCH_TAGS.join(', ')}]
       -> RECOMMENDED: Use Option B (Deep Research).

                                    2. **Agentic Workflow Triggers**: If the user asks for an "agent", "loop", "autonomous task", "coding bot", or implies the need for:
                                    [${AGENTIC_TAGS.join(', ')}]
       -> RECOMMENDED: Use Option C (Agentic Workflow).

                                    3. **Comparison Triggers**: If the user asks to "compare", "diff", "contrast", or "find differences":
       -> REQUIRED: Add a 'clarifyingQuestion' about the RELATIONSHIP between the items (e.g., "Are these different versions, different products, or A/B test variants?").
       -> RECOMMENDED: Use Option A but assume multiple contexts in <CONTEXT>.

                                        4. **Standard**: If neither of the above apply, use Option A.

                                        ### Recommendation Instruction
                                        - ALWAYS provide the rewritten 'recommendedPrompt' field using one of the structures above.
                                        - Even if the original prompt is good, try to optimize it further or at least format it into the strict XML structure.
                                        - Do NOT return null for 'recommendedPrompt'.

                                        ### Prompt Structures
                                        Choose the structure that best fits the user's intent.

                                        **Option A: Standard (General Purpose)**
                                        Use this for clear, simple tasks.
                                        \`\`\`xml
                                        <!-- RECOMMENDED PROMPT STRUCTURE -->
                                        <GOAL> [Clear statement of the objective] </GOAL>
                                        <CONTEXT> [Relevant background info] </CONTEXT>
                                        <INSTRUCTIONS>
                                            - [ ] [Specific task 1]
                                            - CRITICAL: [Safety or constraint]
                                        </INSTRUCTIONS>
                                        <OUTPUT_FORMAT> [Output requirements] </OUTPUT_FORMAT>
                                        \`\`\`

                                        **Option B: Deep Research (For Reports/Writing)**
                                        Use this for requests asking for reports, deep research, or comprehensive writing.
                                        \`\`\`xml
                                        <!-- RESEARCH STRUCTURE -->
                                        <GOAL> [Research goal] </GOAL>
                                        <REPORT_FORMAT> [Structure of the report, e.g. defined sections] </REPORT_FORMAT>
                                        <DOCUMENT_STRUCTURE>
                                            - Begin with title
                                            - Usage of ## and ### headers
                                            - Narrative flow, no lists
                                        </DOCUMENT_STRUCTURE>
                                        <STYLE_GUIDE> [Tone, academic prose, no lists] </STYLE_GUIDE>
                                        <CITATIONS> [Link citations inline] </CITATIONS>
                                        \`\`\`

                                        **Option C: Agentic Workflow (For Complex/Autonomous Tasks)**
                                        Use this for autonomous agent tasks, coding loops, or multi-step execution.
                                        \`\`\`xml
                                        <!-- AGENTIC STRUCTURE -->
                                        <AGENT_IDENTITY> [Who the agent is] </AGENT_IDENTITY>
                                        <PLANNER_MODULE> [How to plan steps] </PLANNER_MODULE>
                                        <AGENT_LOOP> [Analyze -> Select Tools -> Wait -> Iterate] </AGENT_LOOP>
                                        <RULES>
                                            <TODO_RULES> [Maintain a todo.md] </TODO_RULES>
                                            <CODING_RULES> [Save code to files, etc.] </CODING_RULES>
                                            <FILE_RULES> [Read/write/append rules] </FILE_RULES>
                                        </RULES>
                                        \`\`\`

                                        ### Recommendation Style
                                        -   **Concise**: The 'recommendedPrompt' must be efficient. Remove unnecessary polite fillers.
                                        -   **No Repetition**: Do not include the same instruction multiple times (e.g., in both Instructions and Context). Use the most appropriate section only.
                                        -   **Directness**: Avoid "You should..." or "I recommend...". Just state the instruction or constraint.

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
                                        -   **Recommended Prompt**: This MUST be a valid string in the JSON. Escape newlines and quotes properly if needed.
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
