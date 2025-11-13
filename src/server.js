import "dotenv/config";

import fs from "fs";
import http from "http";
import https from "https";

import connectDB from "#app/configs/db.js";
import logger from "#app/configs/logger.js";
import seedAdmin from "#app/configs/seedAdmin.js";
import app from "#src/app.js";

// 🌍 Config
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const HTTPS = process.env.HTTPS === "true";

// 🔐 Server Setup
let server;
if (HTTPS) {
	const { SSL_KEY_PATH, SSL_CERT_PATH, SSL_CA_PATH } = process.env;

	if (!fs.existsSync(SSL_KEY_PATH) || !fs.existsSync(SSL_CERT_PATH)) {
		console.error("❌ SSL cert or key file does not exist.");
		process.exit(1);
	}

	const sslOptions = {
		key: fs.readFileSync(SSL_KEY_PATH),
		cert: fs.readFileSync(SSL_CERT_PATH),
	};

	if (SSL_CA_PATH && fs.existsSync(SSL_CA_PATH)) {
		sslOptions.ca = fs.readFileSync(SSL_CA_PATH);
	}

	server = https.createServer(sslOptions, app);
} else {
	server = http.createServer(app);
}

// 🚀 Start Server
(async () => {
	try {
		console.clear();
		await connectDB();
		await seedAdmin();
		server.listen(PORT, HOST, () => {
			logger.info("✅ Server started successfully");
			console.log(`✅ Server running at ${HTTPS ? "https" : "http"}://${HOST}:${PORT}`);
		});
	} catch (error) {
		console.error("❌ Server startup failed:", error.message);
		process.exit(1);
	}
})();
