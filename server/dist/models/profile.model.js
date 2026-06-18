"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeekerProfile = void 0;
const mongoose_1 = require("mongoose");
const seekerProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    education: [
        {
            degree: { type: String, required: true },
            institution: { type: String, required: true },
            year: { type: Number, required: true },
        },
    ],
    skills: [{ type: String, trim: true }],
    projects: [
        {
            title: { type: String, required: true },
            description: { type: String, required: true },
            tech: [{ type: String, trim: true }],
        },
    ],
    experience: [
        {
            role: { type: String, required: true },
            org: { type: String, required: true },
            durationMonths: { type: Number, required: true },
            summary: { type: String, required: true },
        },
    ],
    preferences: {
        roles: [{ type: String, trim: true }],
        locations: [{ type: String, trim: true }],
        workMode: {
            type: String,
            enum: ["remote", "onsite", "hybrid", "any"],
            default: "any",
        },
    },
    resumeUrl: { type: String },
    resumeText: { type: String },
    embedding: [{ type: Number }],
    completeness: { type: Number, default: 0 },
}, {
    timestamps: true,
});
exports.SeekerProfile = (0, mongoose_1.model)("SeekerProfile", seekerProfileSchema);
exports.default = exports.SeekerProfile;
