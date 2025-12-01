import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 120,
	message: "Too many requests from this IP, please try again later.",
	keyGenerator: (req, _res) => req.headers["device-id"] || req.ip,
	standardHeaders: true,
	legacyHeaders: false,
});

export const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	message: "Too many login attempts, try again later.",
	keyGenerator: (req, _res) => req.headers["device-id"] || req.ip,
	standardHeaders: true,
	legacyHeaders: false,
});
