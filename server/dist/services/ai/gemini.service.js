"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateText = exports.parseResumeText = exports.getEmbedding = exports.MODELS = void 0;
const genai_1 = require("@google/genai");
const env_1 = __importDefault(require("../../config/env"));
const isGeminiConfigured = !!env_1.default.GEMINI_API_KEY;
// Only instantiate GoogleGenAI if the API key is present
const ai = isGeminiConfigured ? new genai_1.GoogleGenAI({ apiKey: env_1.default.GEMINI_API_KEY }) : null;
exports.MODELS = {
    text: "gemini-2.0-flash",
    embedding: "text-embedding-004",
};
// 200 common skills/tech terms to map to embedding indices for deterministic mock embeddings
const COMMON_KEYWORDS = [
    "react", "node", "javascript", "typescript", "mongodb", "express", "html", "css",
    "tailwind", "python", "django", "flask", "java", "spring", "c++", "c#", "golang",
    "ruby", "rails", "php", "sql", "postgresql", "mysql", "redis", "docker", "kubernetes",
    "aws", "gcp", "azure", "git", "github", "graphql", "rest", "api", "next.js", "nest.js",
    "angular", "vue", "jquery", "bootstrap", "sass", "webpack", "vite", "jest", "cypress",
    "prisma", "sequelize", "mongoose", "firebase", "oauth", "jwt", "microservices",
    "redux", "zustand", "mobx", "webpack", "npm", "yarn", "linux", "bash", "nginx",
    "apache", "figma", "agile", "scrum", "devops", "ci/cd", "machine learning", "deep learning",
    "ai", "nlp", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "data science",
    "rust", "kotlin", "swift", "flutter", "react native", "electron", "webassembly",
    "overleaf", "latex", "ats", "resume", "cv", "portfolio", "cloud", "security"
];
/**
 * Generate a mock 768-dimensional embedding vector deterministically based on text content.
 * If keyword is present, set its corresponding index to 1.0.
 * Fill the rest with low pseudo-random noise seeded by the text length/content.
 */
const generateMockEmbedding = (text) => {
    const vector = new Array(768).fill(0);
    const normalizedText = text.toLowerCase();
    // Populate first COMMON_KEYWORDS.length dimensions based on keywords
    COMMON_KEYWORDS.forEach((keyword, index) => {
        if (normalizedText.includes(keyword)) {
            vector[index] = 1.0;
        }
    });
    // Fill remaining dimensions with deterministic pseudo-random noise between 0.01 and 0.05
    // using a simple seed from the text hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    for (let i = COMMON_KEYWORDS.length; i < 768; i++) {
        const val = Math.abs(Math.sin(hash + i)) * 0.04 + 0.01;
        vector[i] = parseFloat(val.toFixed(4));
    }
    // Normalize the vector so it has a magnitude of 1 (unit vector)
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        return vector.map((val) => parseFloat((val / magnitude).toFixed(6)));
    }
    return vector;
};
/**
 * Generate embedding vector using Gemini API, or fallback to mock vector
 */
const getEmbedding = async (text) => {
    if (!isGeminiConfigured || !ai) {
        console.log("⚠️ [AI SERVICE] Gemini API key missing. Generating mock embedding vector.");
        return generateMockEmbedding(text);
    }
    try {
        const response = await ai.models.embedContent({
            model: exports.MODELS.embedding,
            contents: text,
        });
        const res = response;
        if (res.embedding?.values) {
            return res.embedding.values;
        }
        if (res.embeddings && res.embeddings[0]?.values) {
            return res.embeddings[0].values;
        }
        throw new Error("Empty embedding returned from Gemini");
    }
    catch (error) {
        console.error("❌ [AI SERVICE] Gemini embedding error:", error);
        return generateMockEmbedding(text);
    }
};
exports.getEmbedding = getEmbedding;
/**
 * Generate parsed profile from resume text using Gemini Structured Outputs, or fallback to mock parser.
 */
const parseResumeText = async (text) => {
    if (!isGeminiConfigured || !ai) {
        console.log("⚠️ [AI SERVICE] Gemini API key missing. Running mock resume parser.");
        return runMockResumeParser(text);
    }
    try {
        const prompt = `
      You are a professional ATS resume parser. Extract the user's details from the resume text provided.
      Return the output strictly in the requested JSON schema.
      
      Resume Text:
      ${text}
    `;
        // Define the schema for structured output
        const responseSchema = {
            type: "OBJECT",
            properties: {
                skills: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "List of technical skills, frameworks, tools and programming languages."
                },
                education: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            degree: { type: "STRING", description: "Degree name e.g. B.Tech Computer Science, MS" },
                            institution: { type: "STRING", description: "School, College, or University name" },
                            year: { type: "INTEGER", description: "Graduation year e.g. 2024" }
                        },
                        required: ["degree", "institution", "year"]
                    }
                },
                projects: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            title: { type: "STRING", description: "Project title" },
                            description: { type: "STRING", description: "1-2 sentence description of what the project did" },
                            tech: { type: "ARRAY", items: { type: "STRING" }, description: "Tech stack used in this project" }
                        },
                        required: ["title", "description"]
                    }
                },
                experience: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            role: { type: "STRING", description: "Job title or position" },
                            org: { type: "STRING", description: "Company or organization name" },
                            durationMonths: { type: "INTEGER", description: "Number of months worked" },
                            summary: { type: "STRING", description: "1-2 sentence description of accomplishments" }
                        },
                        required: ["role", "org", "durationMonths", "summary"]
                    }
                }
            },
            required: ["skills", "education", "projects", "experience"]
        };
        const response = await ai.models.generateContent({
            model: exports.MODELS.text,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        const parsedJson = JSON.parse(response.text || "{}");
        return parsedJson;
    }
    catch (error) {
        console.error("❌ [AI SERVICE] Gemini resume parsing error:", error);
        return runMockResumeParser(text);
    }
};
exports.parseResumeText = parseResumeText;
/**
 * Heuristics-based mock resume parser
 */
const runMockResumeParser = (text) => {
    const lowercaseText = text.toLowerCase();
    // Extract skills based on common keywords
    const skills = [];
    COMMON_KEYWORDS.slice(0, 50).forEach((keyword) => {
        // Search with word boundary to avoid partial matching
        const regex = new RegExp(`\\b${keyword}\\b`, "i");
        if (regex.test(text)) {
            // Capitalize first letters properly
            const formatted = keyword.split(".").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(".");
            skills.push(formatted);
        }
    });
    // Default skills if none matched
    if (skills.length === 0) {
        skills.push("JavaScript", "React", "Node.js", "HTML", "CSS", "Git");
    }
    // Detect education
    const education = [];
    if (lowercaseText.includes("b.tech") || lowercaseText.includes("bachelor")) {
        education.push({
            degree: "B.Tech Computer Science",
            institution: lowercaseText.includes("iit")
                ? "Indian Institute of Technology (IIT)"
                : lowercaseText.includes("nit")
                    ? "National Institute of Technology (NIT)"
                    : "State Technical University",
            year: 2025
        });
    }
    else {
        education.push({
            degree: "B.Sc Computer Science",
            institution: "City Commerce & Science College",
            year: 2024
        });
    }
    // Detect/Generate projects
    const projects = [];
    if (lowercaseText.includes("portfolio") || lowercaseText.includes("website")) {
        projects.push({
            title: "Personal Portfolio Website",
            description: "A highly responsive developer portfolio showcasing projects and contact forms with custom animations.",
            tech: skills.slice(0, 3)
        });
    }
    if (lowercaseText.includes("e-commerce") || lowercaseText.includes("shop") || projects.length === 0) {
        projects.push({
            title: "E-Commerce Web Application",
            description: "Full-stack e-commerce marketplace featuring product catalog, shopping cart, and mock payment gateway integration.",
            tech: ["React", "Node.js", "Express", "MongoDB"]
        });
    }
    // Experience
    const experience = [];
    if (lowercaseText.includes("intern") || lowercaseText.includes("work")) {
        experience.push({
            role: "Software Development Intern",
            org: "InnovateTech Solutions",
            durationMonths: 6,
            summary: "Developed frontend user dashboard components using React and helped refactor legacy CSS to modern Tailwind code."
        });
    }
    else {
        experience.push({
            role: "Freelance Web Developer",
            org: "Self-Employed",
            durationMonths: 12,
            summary: "Built custom websites for small local businesses using HTML, CSS, JavaScript, and WordPress."
        });
    }
    return {
        skills,
        education,
        projects,
        experience
    };
};
/**
 * General helper to run Gemini calls with prompt string (used by other AI tools)
 */
const generateText = async (prompt, mockResponse) => {
    if (!isGeminiConfigured || !ai) {
        console.log("⚠️ [AI SERVICE] Gemini API key missing. Returning mock text response.");
        return mockResponse;
    }
    try {
        const response = await ai.models.generateContent({
            model: exports.MODELS.text,
            contents: prompt,
        });
        return response.text || mockResponse;
    }
    catch (error) {
        console.error("❌ [AI SERVICE] Gemini text generation error:", error);
        return mockResponse;
    }
};
exports.generateText = generateText;
