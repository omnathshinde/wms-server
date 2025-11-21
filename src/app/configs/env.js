import dotenv from "dotenv";
import fs from "fs";

const envFile =
	process.env.NODE_ENV === "production"
		? ".env.production"
		: process.env.NODE_ENV === "testing"
			? ".env.testing"
			: ".env.development";

if (fs.existsSync(envFile)) {
	dotenv.config({ path: envFile });
} else {
	console.warn(`⚠️ Env file ${envFile} not found, falling back to default .env`);
	dotenv.config();
}

export default {
	NODE_ENV: process.env.NODE_ENV,
	PORT: process.env.PORT || 3000,
	HOST: process.env.HOST || "localhost",
	HTTPS: process.env.HTTPS === "true",

	DB_NAME: process.env.DB_NAME || "",
	DB_USER: process.env.DB_USER || "",
	DB_PASS: process.env.DB_PASS || "",
	DB_HOST: process.env.DB_HOST || "localhost",
	DB_DIALECT: process.env.DB_DIALECT || "mysql",

	JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || "",
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "3600",

	JWT_REFRESH_SECRET_KEY: process.env.JWT_REFRESH_SECRET_KEY || "",
	JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "86400",
};
