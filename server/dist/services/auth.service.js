"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.resendOtp = exports.verifyOtp = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = __importDefault(require("../config/env"));
const user_model_1 = __importDefault(require("../models/user.model"));
const otpToken_model_1 = __importDefault(require("../models/otpToken.model"));
const transporter = nodemailer_1.default.createTransport({
    host: env_1.default.SMTP_HOST || "",
    port: env_1.default.SMTP_PORT,
    secure: env_1.default.SMTP_PORT === 465,
    auth: {
        user: env_1.default.SMTP_USER || "",
        pass: env_1.default.SMTP_PASS || "",
    },
});
const sendOtpEmail = async (email, code) => {
    const isSmtpConfigured = env_1.default.SMTP_HOST && env_1.default.SMTP_USER && env_1.default.SMTP_PASS;
    if (!isSmtpConfigured) {
        console.log(`
=========================================================
[DEV OTP SERVICE] Email: ${email}
[DEV OTP SERVICE] Verification Code: ${code}
=========================================================
    `);
        return;
    }
    const mailOptions = {
        from: `"AI Job Seeker" <${env_1.default.SMTP_USER}>`,
        to: email,
        subject: "AI Job Seeker - Verify Your Account",
        text: `Your verification code is: ${code}. It is valid for 5 minutes.`,
        html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e6e9f0; rounded-radius: 12px;">
        <h2 style="color: #4f46e5; text-align: center;">Verify Your Account</h2>
        <p>Thank you for signing up with AI Job Seeker. Use the verification code below to activate your account:</p>
        <div style="background-color: #eef0ff; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; border-radius: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 5 minutes. If you did not sign up for this account, you can safely ignore this email.</p>
      </div>
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`📡 OTP email sent to ${email}`);
    }
    catch (err) {
        console.error(`❌ Failed to send OTP email to ${email}:`, err);
        throw new Error("Failed to send verification email. Please try again.");
    }
};
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ userId: user._id.toString(), role: user.role }, env_1.default.JWT_SECRET, { expiresIn: env_1.default.JWT_EXPIRES_IN });
};
const registerUser = async (data) => {
    const existingUser = await user_model_1.default.findOne({ email: data.email });
    if (existingUser) {
        throw new Error("Email already in use");
    }
    // Create unverified user
    const user = await user_model_1.default.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        role: data.role,
        verified: false,
    });
    // Generate and save OTP
    const code = generateOtp();
    const salt = await bcrypt_1.default.genSalt(10);
    const codeHash = await bcrypt_1.default.hash(code, salt);
    await otpToken_model_1.default.create({
        userId: user._id,
        codeHash,
        purpose: "verification",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiration
    });
    // Send OTP
    await sendOtpEmail(user.email, code);
    return {
        userId: user._id.toString(),
        email: user.email,
    };
};
exports.registerUser = registerUser;
const verifyOtp = async (email, code) => {
    const user = await user_model_1.default.findOne({ email });
    if (!user) {
        throw new Error("User not found");
    }
    const otpToken = await otpToken_model_1.default.findOne({ userId: user._id, purpose: "verification" });
    if (!otpToken) {
        throw new Error("Invalid or expired OTP");
    }
    // Compare OTP
    const isMatch = await bcrypt_1.default.compare(code, otpToken.codeHash);
    if (!isMatch) {
        throw new Error("Invalid OTP code");
    }
    // Mark user as verified
    user.verified = true;
    await user.save();
    // Clean up OTP
    await otpToken_model_1.default.deleteOne({ _id: otpToken._id });
    const token = generateToken(user);
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    return {
        token,
        user: userResponse,
    };
};
exports.verifyOtp = verifyOtp;
const resendOtp = async (email) => {
    const user = await user_model_1.default.findOne({ email });
    if (!user) {
        throw new Error("User not found");
    }
    if (user.verified) {
        throw new Error("Account is already verified");
    }
    // Delete previous OTP tokens
    await otpToken_model_1.default.deleteMany({ userId: user._id, purpose: "verification" });
    // Generate new OTP
    const code = generateOtp();
    const salt = await bcrypt_1.default.genSalt(10);
    const codeHash = await bcrypt_1.default.hash(code, salt);
    await otpToken_model_1.default.create({
        userId: user._id,
        codeHash,
        purpose: "verification",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });
    await sendOtpEmail(user.email, code);
};
exports.resendOtp = resendOtp;
const loginUser = async (email, passwordHash) => {
    const user = await user_model_1.default.findOne({ email });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    // Check password
    const isMatch = await bcrypt_1.default.compare(passwordHash, user.passwordHash);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }
    if (!user.verified) {
        throw new Error("Account not verified. Please verify using OTP.");
    }
    const token = generateToken(user);
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    return {
        token,
        user: userResponse,
    };
};
exports.loginUser = loginUser;
