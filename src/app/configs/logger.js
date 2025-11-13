import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import winston from "winston";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.resolve(__dirname, "../../../logs");
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
	winston.format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
	winston.format.errors({ stack: true }),
	winston.format.json(),
);

const levelFilter = (level) =>
	winston.format((info) => (info.level === level ? info : false));

const logger = winston.createLogger({
	format: logFormat,
	transports: [
		new winston.transports.File({
			filename: path.join(logDir, "app.log"),
			level: "info",
		}),
		new winston.transports.File({
			filename: path.join(logDir, "auth.log"),
			level: "warn",
			format: winston.format.combine(levelFilter("warn")(), logFormat),
		}),
		new winston.transports.File({
			filename: path.join(logDir, "error.log"),
			level: "error",
			format: winston.format.combine(levelFilter("error")(), logFormat),
		}),
	],
});
export default logger;
