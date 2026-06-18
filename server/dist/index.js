"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const env_1 = __importDefault(require("./config/env"));
const db_1 = __importDefault(require("./config/db"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const app = (0, express_1.default)();
// Set security headers
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false, // Allow loading local files in frontend
}));
// Enable CORS
app.use((0, cors_1.default)({
    origin: env_1.default.CLIENT_URL,
    credentials: true,
}));
// Body parser middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Global rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            message: "Too many requests from this IP, please try again after 15 minutes",
        },
    },
});
app.use(limiter);
// Serve uploads static folder
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../../uploads")));
// Register routes
app.use("/api", health_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/profile", profile_routes_1.default);
// Centralized error handling
app.use(errorHandler_1.default);
// Connect database and start server
const startServer = async () => {
    await (0, db_1.default)();
    app.listen(env_1.default.PORT, () => {
        console.log(`🚀 Server running in ${env_1.default.NODE_ENV} mode on port ${env_1.default.PORT}`);
    });
};
startServer().catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
});
