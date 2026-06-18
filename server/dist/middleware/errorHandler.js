"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[ERROR] ${req.method} ${req.url} - Status: ${statusCode} - Message: ${message}`);
    if (err.stack && process.env.NODE_ENV !== "production") {
        console.error(err.stack);
    }
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            details: err.details || null,
        },
    });
};
exports.errorHandler = errorHandler;
exports.default = exports.errorHandler;
