"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    CLIENT_URL: zod_1.z.string().default("http://localhost:5173"),
    MONGODB_URI: zod_1.z.string().default("mongodb://localhost:27017/ai-job-seeker"),
    JWT_SECRET: zod_1.z.string().default("development_secret_key_1234567890"),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional(),
    CLOUDINARY_API_KEY: zod_1.z.string().optional(),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().optional().default(587),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
});
const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("❌ Environment validation error:", result.error.format());
        process.exit(1);
    }
    const env = result.data;
    // Log warnings for missing credentials
    if (!env.GEMINI_API_KEY) {
        console.warn("⚠️ Warning: GEMINI_API_KEY is not set. AI features will use mock fallbacks.");
    }
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
        console.warn("⚠️ Warning: Cloudinary configuration is missing. Resume uploads will fallback to local storage.");
    }
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
        console.warn("⚠️ Warning: SMTP configurations are missing. OTP codes will be printed to server console.");
    }
    return env;
};
exports.env = parseEnv();
exports.default = exports.env;
