const { GoogleGenAI } = require("@google/genai");
const { OpenRouter } = require("@openrouter/sdk");

let ai;

const getAiClient = () => {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY });
    }
    return ai;
};

const client = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

async function generateResponse(message) {
    try {
        const response = await client.chat.send({
            chatRequest: {
                model: "openai/gpt-oss-120b:free",
                messages: [{ role: "user", content: message }],
            },
        });
        const aiMessage = response.choices[0].message.content;
        return aiMessage;
    } catch (error) {
        console.log("RESPONSE ERROR:", error.message);
        return null;
    }
}

async function generateRecommendation(employees) {
    const prompt = `You are an expert HR analyst. Given the following employee array, produce a JSON object with exact keys: \n\n{
    "promotionCandidates": [ {"id":"","name":"","reason":""} ],
    "ranking": [ {"id":"","name":"","score":number,"experience":number} ],
    "trainingSuggestions": { "<employeeId>": ["suggestion1","suggestion2"] },
    "aiFeedback": "short summary text"
}\n\nRules:\n- Return ONLY valid JSON. Do not include any surrounding explanation or markdown.\n- promotionCandidates: top 3 candidates to consider for promotion with brief reason.\n- ranking: full list of employees sorted by performanceScore desc, tie-breaker experience desc.\n- trainingSuggestions: for each employee id provide 1-3 short training recommendations.\n- aiFeedback: 1-2 sentence overall recommendation for HR.\n\nEmployee data:\n${JSON.stringify(employees, null, 2)}`;

    const raw = await generateResponse(prompt);
    if (!raw) throw new Error("Failed to get recommendation from AI provider");

    // Try to parse JSON response. If it is not strict JSON, attempt to extract JSON block.
    const tryParse = (text) => {
        try {
            return JSON.parse(text);
        } catch (e) {
            // attempt to extract JSON substring
            const m = text.match(/\{[\s\S]*\}$/m);
            if (m) {
                try {
                    return JSON.parse(m[0]);
                } catch (e2) {
                    return null;
                }
            }
            return null;
        }
    };

    const parsed = tryParse(raw);
        // sanitize function: strip HTML tags from strings and recursively apply to objects/arrays
        const stripTags = (s) => {
            if (typeof s !== "string") return s;
            // remove HTML tags
            const noTags = s.replace(/<[^>]*>/g, "");
            // collapse excessive whitespace
            return noTags.replace(/\s{2,}/g, " ").trim();
        };

        const sanitize = (value) => {
            if (typeof value === "string") return stripTags(value);
            if (Array.isArray(value)) return value.map(sanitize);
            if (value && typeof value === "object") {
                const out = {};
                for (const [k, v] of Object.entries(value)) {
                    out[k] = sanitize(v);
                }
                return out;
            }
            return value;
        };

        if (parsed) return sanitize(parsed);

        // Fallback: return sanitized raw text for UI to display
        return { raw: sanitize(raw) };
}

async function generateVector(input) {
    try {
        const response = await getAiClient().models.embedContent({
            model: "gemini-embedding-001",
            contents: [input],
            config: {
                outputDimensionality: 768,
            },
        });

        return response.embeddings[0].values;
    } catch (error) {
        console.log("VECTOR ERROR:", error.message);
        return null;
    }
}

module.exports = { generateResponse, generateVector, generateRecommendation };