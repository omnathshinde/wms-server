import jwt from "jsonwebtoken";

// 🔐 Configs
const JWT_SECRET = process.env.JWT_SECRET_KEY || "fallback-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? null; // Access token expiry
const JWT_REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d"; // Refresh token expiry

// ----------------------------
// Generate JWT
// ----------------------------
export const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
	return expiresIn
		? jwt.sign(payload, JWT_SECRET, { expiresIn })
		: jwt.sign(payload, JWT_SECRET); // never expires
};

// Generate refresh token separately
export const generateRefreshToken = (payload, expiresIn = JWT_REFRESH_EXPIRES_IN) => {
	return expiresIn
		? jwt.sign(payload, JWT_SECRET, { expiresIn })
		: jwt.sign(payload, JWT_SECRET); // optional never expire
};

// ----------------------------
// Verify JWT
// ----------------------------
export const verifyToken = (token) => {
	try {
		return jwt.verify(token, JWT_SECRET);
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
