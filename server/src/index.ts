import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import env from "./config/env";
import connectDB from "./config/db";
import healthRouter from "./routes/health.routes";
import authRouter from "./routes/auth.routes";
import errorHandler from "./middleware/errorHandler";

const app = express();

// Set security headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiting
const limiter = rateLimit({
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

// Register routes
app.use("/api", healthRouter);
app.use("/api/auth", authRouter);

// Centralized error handling
app.use(errorHandler);

// Connect database and start server
const startServer = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
