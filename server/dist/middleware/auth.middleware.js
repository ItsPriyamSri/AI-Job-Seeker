"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const user_model_1 = __importDefault(require("../models/user.model"));
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            res.status(401).json({
                success: false,
                error: { message: "Not authorized, token missing" },
            });
            return;
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
        // Get user from DB
        const user = await user_model_1.default.findById(decoded.userId).select("-passwordHash");
        if (!user) {
            res.status(401).json({
                success: false,
                error: { message: "Not authorized, user not found" },
            });
            return;
        }
        if (!user.verified) {
            res.status(403).json({
                success: false,
                error: { message: "Account is not verified. Please verify using OTP." },
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: { message: "Not authorized, invalid token" },
        });
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: { message: `Role '${req.user?.role || "unknown"}' is not authorized to access this resource` },
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
