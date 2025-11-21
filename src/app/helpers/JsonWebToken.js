import jwt from "jsonwebtoken";

import env from "#app/configs/env.js";

// 🔐 Configs
const { JWT_SECRET_KEY, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = env;

// ----------------------------
// Generate JWT
// ----------------------------
export const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
	return expiresIn
		? jwt.sign(payload, JWT_SECRET_KEY, { expiresIn })
		: jwt.sign(payload, JWT_SECRET_KEY); // never expires
};

// Generate refresh token separately
export const generateRefreshToken = (payload, expiresIn = JWT_REFRESH_EXPIRES_IN) => {
	return expiresIn
		? jwt.sign(payload, JWT_SECRET_KEY, { expiresIn })
		: jwt.sign(payload, JWT_SECRET_KEY); // optional never expire
};

// ----------------------------
// Verify JWT
// ----------------------------
export const verifyToken = (token) => {
	try {
		return jwt.verify(token, JWT_SECRET_KEY);
	} catch {
		return null; // expired or invalid
	}
};

// ----------------------------
// Decode JWT without verification
// ----------------------------
export const decodeToken = (token) => {
	try {
		return jwt.decode(token);
	} catch {
		return null;
	}
};

// ----------------------------
// Example usage
// ----------------------------
// const accessToken = generateToken({ userId: 1 }); // auto-expiry or never-expire
// const refreshToken = generateRefreshToken({ userId: 1 }); // long-lived refresh token
// const decoded = verifyToken(accessToken);
