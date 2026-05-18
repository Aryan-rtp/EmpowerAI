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

function buildFallbackRecommendation(employees) {
    const sorted = Array.isArray(employees)
        ? [...employees].sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0) || (b.experience || 0) - (a.experience || 0))
        : [];

    const promotionCandidates = sorted.slice(0, 3).map((e) => ({
        id: e._id || e.id || null,
        name: e.name,
        reason: `Performance score ${e.performanceScore || 0}`,
    }));

    const ranking = sorted.map((e) => ({
        id: e._id || e.id || null,
        name: e.name,
        score: e.performanceScore || 0,
        experience: e.experience || 0,
    }));

    const trainingSuggestions = {};
    (employees || []).forEach((e) => {
        const key = e._id || e.id || e.email || e.name;
        trainingSuggestions[key] = [
            e.skills && e.skills.includes("Node.js") ? "Advanced Node.js patterns" : "Foundational training",
        ];
    });

    return {
        promotionCandidates,
        ranking,
        trainingSuggestions,
        aiFeedback: "AI provider not configured or unavailable in this environment — returning best-effort local recommendation.",
    };
}

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

    // If no AI provider key is configured, return a deterministic mock recommendation
    if (!process.env.OPENROUTER_API_KEY && !process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
        return buildFallbackRecommendation(employees);
    }

    const raw = await generateResponse(prompt);
    if (!raw) return buildFallbackRecommendation(employees);

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

    try {
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

        if (parsed) {
            const normalized = normalizeRecommendation(parsed, employees);
            return sanitize(normalized);
        }

        // Fallback: return deterministic structured recommendation
        return buildFallbackRecommendation(employees);
    } catch (error) {
        console.log("RECOMMENDATION FALLBACK:", error.message);
        return buildFallbackRecommendation(employees);
    }
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

function normalizeRecommendation(obj, employees) {
    const out = {};

    // ranking
    if (Array.isArray(obj.ranking) && obj.ranking.length > 0) {
        out.ranking = obj.ranking.map((r) => ({
            id: r.id || r._id || null,
            name: r.name || "",
            score: typeof r.score === "number" ? r.score : Number(r.score) || 0,
            experience: typeof r.experience === "number" ? r.experience : Number(r.experience) || 0,
        }));
    } else {
        out.ranking = (Array.isArray(employees) ? employees : [])
            .map((e) => ({ id: e._id || e.id || null, name: e.name, score: e.performanceScore || 0, experience: e.experience || 0 }))
            .sort((a, b) => b.score - a.score || b.experience - a.experience);
    }

    // promotionCandidates
    if (Array.isArray(obj.promotionCandidates) && obj.promotionCandidates.length > 0) {
        out.promotionCandidates = obj.promotionCandidates.slice(0, 3).map((p) => ({ id: p.id || p._id || null, name: p.name || "", reason: p.reason || "" }));
    } else {
        out.promotionCandidates = out.ranking.slice(0, 3).map((r) => ({ id: r.id, name: r.name, reason: `Performance score ${r.score}` }));
    }

    // trainingSuggestions
    out.trainingSuggestions = {};
    const suggestionsFromObj = obj.trainingSuggestions || {};
    if (suggestionsFromObj && typeof suggestionsFromObj === "object") {
        for (const [k, v] of Object.entries(suggestionsFromObj)) {
            const key = k;
            if (Array.isArray(v)) out.trainingSuggestions[key] = v.map(String);
            else if (typeof v === "string") out.trainingSuggestions[key] = [v];
        }
    }
    (Array.isArray(employees) ? employees : []).forEach((e) => {
        const key = e._id || e.id || e.email || e.name;
        if (!out.trainingSuggestions[key]) {
            out.trainingSuggestions[key] = [e.skills && e.skills.includes("Node.js") ? "Advanced Node.js patterns" : "Foundational training"];
        }
    });

    out.aiFeedback = (obj.aiFeedback && String(obj.aiFeedback).trim()) || `Focus on top performers while providing targeted upskilling for others.`;

    return out;
}