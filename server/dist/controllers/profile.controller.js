"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResume = exports.updateProfile = exports.getProfile = exports.profileUpdateSchema = void 0;
const zod_1 = require("zod");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const profile_model_1 = __importDefault(require("../models/profile.model"));
const upload_service_1 = require("../services/upload.service");
const gemini_service_1 = require("../services/ai/gemini.service");
// Validation Schema for profile update
exports.profileUpdateSchema = zod_1.z.object({
    education: zod_1.z.array(zod_1.z.object({
        degree: zod_1.z.string().min(1, "Degree is required"),
        institution: zod_1.z.string().min(1, "Institution is required"),
        year: zod_1.z.number().min(1950).max(new Date().getFullYear() + 5),
    })).default([]),
    skills: zod_1.z.array(zod_1.z.string()).default([]),
    projects: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string().min(1, "Project title is required"),
        description: zod_1.z.string().min(1, "Project description is required"),
        tech: zod_1.z.array(zod_1.z.string()).default([]),
    })).default([]),
    experience: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.string().min(1, "Role is required"),
        org: zod_1.z.string().min(1, "Organization is required"),
        durationMonths: zod_1.z.number().min(0),
        summary: zod_1.z.string().min(1, "Summary is required"),
    })).default([]),
    preferences: zod_1.z.object({
        roles: zod_1.z.array(zod_1.z.string()).default([]),
        locations: zod_1.z.array(zod_1.z.string()).default([]),
        workMode: zod_1.z.enum(["remote", "onsite", "hybrid", "any"]).default("any"),
    }),
    resumeUrl: zod_1.z.string().optional(),
});
// Calculate completeness helper
const calculateCompleteness = (profile) => {
    let score = 0;
    if (profile.education && profile.education.length > 0)
        score += 15;
    if (profile.skills && profile.skills.length > 0)
        score += 25;
    if (profile.projects && profile.projects.length > 0)
        score += 20;
    if (profile.experience && profile.experience.length > 0)
        score += 20;
    if (profile.preferences && profile.preferences.roles && profile.preferences.roles.length > 0)
        score += 10;
    if (profile.preferences && profile.preferences.locations && profile.preferences.locations.length > 0)
        score += 10;
    return score;
};
// Retrieve own profile
const getProfile = async (req, res, next) => {
    try {
        const profile = await profile_model_1.default.findOne({ userId: req.user?._id });
        res.status(200).json({
            success: true,
            data: profile, // could be null if not created yet
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
// Create or update own profile
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        const profileData = req.body;
        // Calculate profile completeness
        const completeness = calculateCompleteness(profileData);
        // Generate text representation for matching embedding
        const profileText = `
      Skills: ${profileData.skills.join(", ")}
      Experience: ${profileData.experience.map((e) => `${e.role} at ${e.org} for ${e.durationMonths} months. ${e.summary}`).join("; ")}
      Projects: ${profileData.projects.map((p) => `${p.title}: ${p.description}. Tech: ${p.tech.join(", ")}`).join("; ")}
      Preferences: Roles: ${profileData.preferences.roles.join(", ")}; Locations: ${profileData.preferences.locations.join(", ")}; Work Mode: ${profileData.preferences.workMode}
    `;
        // Compute embedding vector
        const embedding = await (0, gemini_service_1.getEmbedding)(profileText);
        // Update or create SeekerProfile
        const profile = await profile_model_1.default.findOneAndUpdate({ userId }, {
            ...profileData,
            completeness,
            embedding,
        }, { new: true, upsert: true });
        res.status(200).json({
            success: true,
            data: profile,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
// Parse resume PDF/Text and pre-fill form fields
const parseResume = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: { message: "No resume file uploaded" },
            });
            return;
        }
        const fileBuffer = req.file.buffer;
        let extractedText = "";
        // 1. Extract text based on file format
        if (req.file.mimetype === "application/pdf") {
            try {
                const parsedPdf = await (0, pdf_parse_1.default)(fileBuffer);
                extractedText = parsedPdf.text;
            }
            catch (pdfErr) {
                console.error("❌ PDF Parsing Error:", pdfErr);
                res.status(400).json({
                    success: false,
                    error: { message: "Could not read text from PDF file. Try manual entry." },
                });
                return;
            }
        }
        else {
            // .tex or .txt file format
            extractedText = fileBuffer.toString("utf-8");
        }
        if (!extractedText.trim()) {
            res.status(400).json({
                success: false,
                error: { message: "Resume file contains no text. Please upload a different resume." },
            });
            return;
        }
        // 2. Parse text with Gemini structured parser
        const parsedProfile = await (0, gemini_service_1.parseResumeText)(extractedText);
        // 3. Upload file to storage (Cloudinary or local fallback)
        const resumeUrl = await (0, upload_service_1.uploadResumeFile)(fileBuffer, req.file.originalname, req.file.mimetype);
        // Save resume text and URL in DB profile for future queries/ATS analysis
        await profile_model_1.default.findOneAndUpdate({ userId: req.user?._id }, { resumeUrl, resumeText: extractedText }, { upsert: true });
        res.status(200).json({
            success: true,
            data: {
                ...parsedProfile,
                resumeUrl,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.parseResume = parseResume;
