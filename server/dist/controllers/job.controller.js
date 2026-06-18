"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getJobs = exports.jobUpdateSchema = exports.jobCreateSchema = void 0;
const zod_1 = require("zod");
const job_model_1 = __importDefault(require("../models/job.model"));
const gemini_service_1 = require("../services/ai/gemini.service");
// Validation Schema for creating a job
exports.jobCreateSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, "Title must be at least 2 characters"),
    company: zod_1.z.string().min(1, "Company is required"),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters"),
    requirements: zod_1.z.array(zod_1.z.string()).default([]),
    skills: zod_1.z.array(zod_1.z.string()).default([]),
    location: zod_1.z.string().min(1, "Location is required"),
    workMode: zod_1.z.enum(["remote", "onsite", "hybrid", "any"]).default("any"),
    type: zod_1.z.enum(["full-time", "part-time", "internship", "contract", "temporary"]).default("full-time"),
    source: zod_1.z.enum(["internal", "external"]).default("internal"),
    externalUrl: zod_1.z.string().url("Invalid external URL").optional().or(zod_1.z.literal("")),
});
// Validation Schema for updating a job
exports.jobUpdateSchema = exports.jobCreateSchema.partial();
// Get list of all active jobs with search, filtering, and pagination
const getJobs = async (req, res, next) => {
    try {
        const { search, location, workMode, type, page = 1, limit = 10 } = req.query;
        // Construct query object
        const query = { status: "active" };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        if (location) {
            query.location = { $regex: location, $options: "i" };
        }
        if (workMode && workMode !== "all" && workMode !== "any") {
            query.workMode = workMode;
        }
        if (type && type !== "all") {
            query.type = type;
        }
        // Pagination calculations
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        // Fetch matching jobs
        const jobs = await job_model_1.default.find(query)
            .select("-embedding") // Exclude embedding vector from general listing
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const totalJobs = await job_model_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: {
                jobs,
                pagination: {
                    total: totalJobs,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(totalJobs / limitNum),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJobs = getJobs;
// Retrieve a single job details
const getJobById = async (req, res, next) => {
    try {
        const job = await job_model_1.default.findById(req.params.id).select("-embedding");
        if (!job) {
            res.status(404).json({
                success: false,
                error: { message: "Job posting not found" },
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: job,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJobById = getJobById;
// Create a new job posting (recruiter only)
const createJob = async (req, res, next) => {
    try {
        const jobData = req.body;
        // Generate text details for semantic matching embedding
        const jobText = `
      Title: ${jobData.title}
      Company: ${jobData.company}
      Description: ${jobData.description}
      Requirements: ${jobData.requirements.join(", ")}
      Skills: ${jobData.skills.join(", ")}
      Location: ${jobData.location}
      Work Mode: ${jobData.workMode}
    `;
        // Compute embedding vector
        const embedding = await (0, gemini_service_1.getEmbedding)(jobText);
        // Save job posting
        const job = await job_model_1.default.create({
            ...jobData,
            recruiterId: req.user?._id,
            embedding,
        });
        res.status(201).json({
            success: true,
            data: job,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createJob = createJob;
// Edit a job posting (recruiter only)
const updateJob = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const existingJob = await job_model_1.default.findById(jobId);
        if (!existingJob) {
            res.status(404).json({
                success: false,
                error: { message: "Job posting not found" },
            });
            return;
        }
        // Verify ownership
        if (existingJob.recruiterId.toString() !== req.user?._id.toString()) {
            res.status(403).json({
                success: false,
                error: { message: "You are not authorized to update this job posting" },
            });
            return;
        }
        const updateData = req.body;
        // If description/title/skills change, re-generate embedding
        if (updateData.title || updateData.description || updateData.skills || updateData.requirements) {
            const title = updateData.title || existingJob.title;
            const company = updateData.company || existingJob.company;
            const description = updateData.description || existingJob.description;
            const requirements = updateData.requirements || existingJob.requirements;
            const skills = updateData.skills || existingJob.skills;
            const location = updateData.location || existingJob.location;
            const workMode = updateData.workMode || existingJob.workMode;
            const jobText = `
        Title: ${title}
        Company: ${company}
        Description: ${description}
        Requirements: ${requirements.join(", ")}
        Skills: ${skills.join(", ")}
        Location: ${location}
        Work Mode: ${workMode}
      `;
            updateData.embedding = await (0, gemini_service_1.getEmbedding)(jobText);
        }
        const updatedJob = await job_model_1.default.findByIdAndUpdate(jobId, { $set: updateData }, { new: true });
        res.status(200).json({
            success: true,
            data: updatedJob,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateJob = updateJob;
// Delete/Close a job posting (recruiter only)
const deleteJob = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const existingJob = await job_model_1.default.findById(jobId);
        if (!existingJob) {
            res.status(404).json({
                success: false,
                error: { message: "Job posting not found" },
            });
            return;
        }
        // Verify ownership
        if (existingJob.recruiterId.toString() !== req.user?._id.toString()) {
            res.status(403).json({
                success: false,
                error: { message: "You are not authorized to delete this job posting" },
            });
            return;
        }
        // Mark as closed instead of true delete to maintain applicant relations, or delete
        // per instructions. Let's delete it per REST convention or close it.
        // The implementation plan says "Close/remove job", so marking status as closed is safe, 
        // or deleting from DB. Let's delete it so the browse listing is cleaned up.
        await job_model_1.default.findByIdAndDelete(jobId);
        res.status(200).json({
            success: true,
            data: { message: "Job posting removed successfully" },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteJob = deleteJob;
