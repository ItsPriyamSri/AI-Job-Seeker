"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
router.get("/health", (req, res) => {
    const dbStatus = mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected";
    res.status(200).json({
        success: true,
        data: {
            status: "ok",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: dbStatus,
        },
    });
});
exports.default = router;
