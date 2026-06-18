"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Memory storage to hold files in buffer before uploading/processing
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "application/pdf",
        "text/plain",
        "application/x-tex",
        "text/x-tex",
    ];
    // Also accept .tex or .txt extension check as fallback
    const isAllowedExt = file.originalname.endsWith(".pdf") ||
        file.originalname.endsWith(".tex") ||
        file.originalname.endsWith(".txt");
    if (allowedMimeTypes.includes(file.mimetype) || isAllowedExt) {
        cb(null, true);
    }
    else {
        cb(new Error("Invalid file type. Only PDF, TXT, and LaTeX (.tex) files are allowed."));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
exports.default = exports.upload;
