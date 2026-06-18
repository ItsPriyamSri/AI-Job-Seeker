"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResumeFile = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = __importDefault(require("../config/env"));
// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = env_1.default.CLOUDINARY_CLOUD_NAME &&
    env_1.default.CLOUDINARY_API_KEY &&
    env_1.default.CLOUDINARY_API_SECRET;
if (isCloudinaryConfigured) {
    cloudinary_1.v2.config({
        cloud_name: env_1.default.CLOUDINARY_CLOUD_NAME,
        api_key: env_1.default.CLOUDINARY_API_KEY,
        api_secret: env_1.default.CLOUDINARY_API_SECRET,
    });
}
const uploadResumeFile = async (fileBuffer, originalName, mimeType) => {
    if (isCloudinaryConfigured) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: "resumes",
                resource_type: "auto",
                public_id: path_1.default.parse(originalName).name + "_" + Date.now(),
            }, (error, result) => {
                if (error) {
                    console.error("❌ Cloudinary upload error:", error);
                    reject(new Error("Failed to upload file to cloud storage."));
                }
                else {
                    resolve(result?.secure_url || "");
                }
            });
            uploadStream.end(fileBuffer);
        });
    }
    else {
        // Local workspace storage fallback
        // Note: Working directory must be in workspace.
        const uploadDir = path_1.default.join(__dirname, "../../../uploads/resumes");
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
        const fileName = `${Date.now()}_${originalName.replace(/\s+/g, "_")}`;
        const filePath = path_1.default.join(uploadDir, fileName);
        fs_1.default.writeFileSync(filePath, fileBuffer);
        console.log(`📁 File saved locally: ${filePath}`);
        // Return the local serving URL path (e.g. /uploads/resumes/filename)
        return `/uploads/resumes/${fileName}`;
    }
};
exports.uploadResumeFile = uploadResumeFile;
