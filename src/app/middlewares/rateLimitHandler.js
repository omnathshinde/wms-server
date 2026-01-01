import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 120,
	message: "Too many requests from this IP, please try again later.",
	keyGenerator: (req, res) => {
		return req.headers["device-id"] || ipKeyGenerator(req, res);
	},
	standardHeaders: true,
	legacyHeaders: false,
});

export const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	message: "Too many login attempts, try again later.",
	keyGenerator: (req, res) => {
		return req.headers["device-id"] || ipKeyGenerator(req, res);
	},
	standardHeaders: true,
	legacyHeaders: false,
});
