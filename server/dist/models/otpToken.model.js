"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpToken = void 0;
const mongoose_1 = require("mongoose");
const otpTokenSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    codeHash: {
        type: String,
        required: true,
    },
    purpose: {
        type: String,
        enum: ["verification", "password_reset"],
        default: "verification",
    },
    expiresAt: {
        type: Date,
        required: true,
    },
});
// TTL index to automatically delete expired OTP tokens
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.OtpToken = (0, mongoose_1.model)("OtpToken", otpTokenSchema);
exports.default = exports.OtpToken;
