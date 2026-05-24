// 📦 Built-in and Third-Party
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

// 🧩 Custom Middlewares
import audit from "#src/app/middlewares/auditHandler.js";
import errorHandler from "#src/app/middlewares/errorHandler.js";
import logsHandler from "#src/app/middlewares/logsHandler.js";
import queryHandler from "#src/app/middlewares/queryHandler.js";
import { apiLimiter, loginLimiter } from "#src/app/middlewares/rateLimitHandler.js";
import responseHandler from "#src/app/middlewares/responseHandler.js";
import transactionHandler from "#src/app/middlewares/transactionHandler.js";
// 🔐 Auth Controller &🚦 Routes
import authController from "#src/modules/auth/auth.controller.js";
import authRoutes from "#src/modules/auth/auth.routes.js";
import auth from "#src/modules/auth/authHandler.js";

// 🚀 App Initialization
const app = express();

// 🔧 Built-in Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// 🧵 Custom Global Middleware (order matters)
app.use(logsHandler);
app.use(queryHandler);
app.use(responseHandler);

// 🌐 Base Health Check Route
app.get("/", (req, res) => res.status(200).json({ message: "Hello World!" }));

// 🔐 Public Route
app.use("/sign_in", loginLimiter, authController);

// 🔒 Authentication & Auditing (only for protected routes)
app.use(auth);
app.use(audit); // track user actions
app.use(transactionHandler); // per request transaction
app.use(apiLimiter); // apply rate limiting
app.use("", authRoutes); // 📦 Protected Routes

// ⚠️ 404 Handler (must be after all routes, but before error handler)
app.use((req, res) => {
	return res.status(404).json({ message: "API is running", author: "Omnath Shinde" });
});

// ⚠️ Error Handler (last middleware)
app.use(errorHandler);

// 🚀 Export App
export default app;
