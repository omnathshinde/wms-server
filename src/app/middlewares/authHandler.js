import jwt from "jsonwebtoken";
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "jwt_secret_key";

export default (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.sendError(401, "Authorization token is required");
	}

	if (!authHeader.startsWith("JWT")) {
		return res.sendError(401, "Authorization token must start with 'JWT'");
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, JWT_SECRET_KEY);
		if (!decoded) {
			return res.sendError(401, "Unauthorizated User");
		}
		req.user = decoded;
		next();
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return res.sendError(401, "Your session has expired. Please log in again.");
		} else if (error.name === "JsonWebTokenError") {
			return res.sendError(401, "Invalid User");
		}
		next();
		return res.sendError(403, "Access denied");
	}
};
