"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
const mongoose_1 = require("mongoose");
const jobSchema = new mongoose_1.Schema({
    recruiterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    company: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    requirements: [{ type: String }],
    skills: [{ type: String, trim: true }],
    location: {
        type: String,
        required: true,
        trim: true,
    },
    workMode: {
        type: String,
        enum: ["remote", "onsite", "hybrid", "any"],
        default: "any",
    },
    type: {
        type: String,
        enum: ["full-time", "part-time", "internship", "contract", "temporary"],
        default: "full-time",
    },
    source: {
        type: String,
        enum: ["internal", "external"],
        default: "internal",
    },
    externalUrl: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ["active", "closed"],
        default: "active",
    },
    embedding: [{ type: Number }],
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
exports.Job = (0, mongoose_1.model)("Job", jobSchema);
exports.default = exports.Job;
