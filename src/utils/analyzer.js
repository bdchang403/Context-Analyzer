// From SKILL.md: context-degradation
export const MODEL_LIMITS = {
    "gpt-5.2": { name: "GPT 5.2", degradationOnset: 64000, severeDegradation: 200000 },
    "claude-opus-4.5": { name: "Claude Opus 4.5", degradationOnset: 100000, severeDegradation: 180000 },
    "claude-sonnet-4.5": { name: "Claude Sonnet 4.5", degradationOnset: 80000, severeDegradation: 150000 },
    "gemini-3-pro": { name: "Google Gemini 3 Pro", degradationOnset: 500000, severeDegradation: 800000 },
    "gemini-3-flash": { name: "Google Gemini 3 Flash", degradationOnset: 300000, severeDegradation: 600000 },
    "default": { name: "Generic Model", degradationOnset: 16000, severeDegradation: 32000 }
};

export const RESEARCH_TAGS = ['report_format', 'document_structure', 'style_guide', 'citations', 'special_formats', 'planning_rules'];
export const AGENTIC_TAGS = ['agent_loop', 'planner_module', 'knowledge_module', 'datasource_module', 'todo_rules', 'browser_rules', 'shell_rules'];

export const analyzePrompt = (text, modelKey = "default") => {
    const issues = [];
    const goodPoints = [];
    let score = 100;

    if (!text || text.trim().length === 0) {
        return { score: 0, issues: [], goodPoints: [] };
    }

    // 1. Length & Degradation Check (Early exit/penalty for too short)
    const charCount = text.length;
    const tokenCount = Math.ceil(charCount / 4);

    if (tokenCount < 20) {
        score -= 30;
        issues.push({
            category: "Clarity",
            text: "Prompt is too short to provide adequate context. Expand on your request.",
            example: "Instead of 'Fix code', try 'Fix the bug in the authentication module where...'",
            severity: "high"
        });
    }

    // 2. Structure Check (XML or Markdown Headers)
    // Relaxed XML regex to catch tags with attributes and varying case
    const hasXmlTags = /<([a-zA-Z0-9_-]+)(?:\s+[^>]*)?>[\s\S]*?<\/\1>/i.test(text);
    const hasMarkdownHeaders = /^#{1,6}\s+.+$/m.test(text);

    if (hasXmlTags) {
        goodPoints.push("You are using XML tags for structural separation, which is excellent for modern models.");

        // Advanced Structure Detection
        const lowerText = text.toLowerCase();
        const researchCount = RESEARCH_TAGS.filter(tag => lowerText.includes(`<${tag}>`)).length;
        const agenticCount = AGENTIC_TAGS.filter(tag => lowerText.includes(`<${tag}>`)).length;

        if (researchCount >= 2) {
            goodPoints.push("Detected 'Deep Research' structure (e.g. style guides, report formats). This is excellent for comprehensive output tasks.");
        }
        if (agenticCount >= 2) {
            goodPoints.push("Detected 'Agentic' structure (e.g. loops, planning modules). This is great for autonomous or complex multi-step workflows.");
        }
    }

    if (hasMarkdownHeaders) {
        goodPoints.push("You are using Markdown headers. This is good, but XML tags are often preferred for stricter separation.");
    }

    if (!hasXmlTags && !hasMarkdownHeaders) {
        score -= 20;
        issues.push({
            category: "Structure",
            text: "No clear structural separation detected. Use XML tags (e.g., <INSTRUCTIONS>) or Markdown headers to organize sections.",
            example: `<INSTRUCTIONS>
  Your instructions here...
</INSTRUCTIONS>

<CONTEXT>
  ...
</CONTEXT>`,
            severity: "high"
        });
    }

    // 2. Length & Degradation Check (continued)
    // charCount and tokenCount calculated above

    const limits = MODEL_LIMITS[modelKey] || MODEL_LIMITS["default"];

    if (tokenCount > limits.severeDegradation) {
        score -= 25;
        issues.push({
            category: "Degradation",
            text: `Your prompt is approx. ${tokenCount} tokens. This exceeds the severe degradation threshold (~${limits.severeDegradation}) for ${limits.name}. Immediate context compression is required.`,
            example: `Consider summarizing or moving content to external files:

Current: [200 pages of text...]
Better: "Refer to the documentation in docs/api_summary.md"`,
            severity: "high"
        });
    } else if (tokenCount > limits.degradationOnset) {
        score -= 15;
        issues.push({
            category: "Degradation",
            text: `Your prompt is approx. ${tokenCount} tokens. Degradation risks start appearing around ${limits.degradationOnset} tokens for ${limits.name}. Consider 'Context Compression' or moving some content to RAG/Files.`,
            example: `# Compression Strategy
1. Move static reference data to files.
2. Summarize conversation history.
3. Use specific retrieval queries instead of full dumps.`,
            severity: "medium"
        });
    } else if (tokenCount > limits.degradationOnset * 0.5) {
        issues.push({
            category: "Degradation",
            text: `Your prompt is getting large (~${tokenCount} tokens). It is >50% of the degradation onset for ${limits.name}. Ensure critical info is at the beginning or end (Lost-in-Middle phenomenon).`,
            example: `<CRITICAL_INFO>
  Goal: Fix the login bug.
  Deadline: Today.
</CRITICAL_INFO>

[... Less critical context ...]`,
            severity: "low"
        });
    }

    // 3. Content Essentials
    const lower = text.toLowerCase();
    if (!lower.includes("goal") && !lower.includes("objective") && !lower.includes("task")) {
        score -= 10;
        issues.push({
            category: "Clarity",
            text: "No explicit 'Goal', 'Objective', or 'Task' definition found. Define the agent's purpose clearly.",
            example: `Goal: You are a coding assistant specializing in Python.
Task: Refactor the provided code to match PEP 8 standards.`,
            severity: "high"
        });
    }

    if (!lower.includes("example") && !text.includes("```")) {
        score -= 10;
        issues.push({
            category: "Few-Shot",
            text: "No examples detected. Providing examples (few-shot prompting) significantly improves adherence.",
            example: `Example Input: "Calculate 2+2"
Example Output: "4"

Example Input: "Hello"
Example Output: "Hi there! How can I help?"`,
            severity: "medium"
        });
    }

    // 4. Lost-in-Middle specific check
    // If "Goal" is in the middle 50% of text
    const goalIndex = lower.indexOf("goal");
    if (goalIndex > charCount * 0.25 && goalIndex < charCount * 0.75) {
        issues.push({
            category: "Optimization",
            text: "Your 'Goal' definition appears in the middle of the prompt. Move critical instructions to the start or end to avoid attention degradation.",
            example: `[START OF PROMPT]
Goal: Extract user intents from the chat logs.
...
[END OF PROMPT]`,
            severity: "medium"
        });
        score -= 5;
    }

    // 5. Vague Phrase Check
    const vagueRegexes = [
        { regex: /\betc\./i, label: "etc." },
        { regex: /\bet cetera\b/i, label: "et cetera" },
        { regex: /\band so on\b/i, label: "and so on" },
        { regex: /\band so forth\b/i, label: "and so forth" },
        { regex: /\band the like\b/i, label: "and the like" },
        { regex: /\band that kind of thing\b/i, label: "and that kind of thing" },
        { regex: /\band stuff(?=\s+like that|[.,;!?]|$)/i, label: "and stuff (like that)" },
        { regex: /\band things(?=\s+like that|[.,;!?]|$)/i, label: "and things (like that)" },
        { regex: /\band what have you\b/i, label: "and what have you" }
    ];

    const foundVaguePhrases = [];
    vagueRegexes.forEach(({ regex, label }) => {
        if (regex.test(text)) {
            foundVaguePhrases.push(label);
        }
    });

    if (foundVaguePhrases.length > 0) {
        // Deduct points for using vague language
        score -= 5 * foundVaguePhrases.length;

        issues.push({
            category: "Preciseness",
            text: `Vague phrases detected: ${foundVaguePhrases.map(m => `"${m}"`).join(", ")}. Precise instructions lead to better results.`,
            example: "Instead of '...and so on', explicitly list all required items or criteria.",
            severity: "medium"
        });
    }

    return {
        score: Math.max(0, score),
        issues,
        goodPoints,
        stats: { charCount, tokenCount }
    };
};
