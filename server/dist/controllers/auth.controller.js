"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.login = exports.resend = exports.verify = exports.register = exports.loginSchema = exports.resendOtpSchema = exports.verifyOtpSchema = exports.registerSchema = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const authService = __importStar(require("../services/auth.service"));
// Validation schemas
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    email: zod_1.z.string().email("Invalid email format"),
    phone: zod_1.z.string().optional(),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    role: zod_1.z.enum(["seeker", "recruiter"]),
});
exports.verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    code: zod_1.z.string().length(6, "OTP must be exactly 6 digits"),
});
exports.resendOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(1, "Password is required"),
});
const register = async (req, res, next) => {
    try {
        const { name, email, phone, password, role } = req.body;
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(password, salt);
        const result = await authService.registerUser({
            name,
            email,
            phone,
            passwordHash,
            role,
        });
        res.status(201).json({
            success: true,
            data: {
                message: "Registration successful. OTP sent to your contact.",
                userId: result.userId,
                email: result.email,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const verify = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        const result = await authService.verifyOtp(email, code);
        res.status(200).json({
            success: true,
            data: {
                message: "Account verified successfully",
                token: result.token,
                user: result.user,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verify = verify;
const resend = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.resendOtp(email);
        res.status(200).json({
            success: true,
            data: {
                message: "New OTP sent successfully",
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resend = resend;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.status(200).json({
            success: true,
            data: {
                message: "Login successful",
                token: result.token,
                user: result.user,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const me = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                user: req.user,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.me = me;
