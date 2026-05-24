import "dotenv/config";

import fs from "fs";
import http from "http";
import https from "https";

import app from "#src/app/app.js";
import connectDB from "#src/app/configs/db.js";
import env from "#src/app/configs/env.js";
import logger from "#src/app/configs/logger.js";
import seedAdmin from "#src/app/configs/seedAdmin.js";

// 🌍 Config
const { PORT, HOST, HTTPS, SSL_KEY_PATH, SSL_CERT_PATH, SSL_CA_PATH } = env;

// 🔐 Server Setup
let server;
if (HTTPS) {
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
		// console.clear();
		await connectDB();
		await seedAdmin();
		server.listen(PORT, HOST, () => {
			logger.info("✅ Server started successfully");
			console.log(
				`🚀 Server Running Environment : ${env.NODE_ENV}\n🔗 URL : ${env.HTTPS ? "https" : "http"}://${env.HOST}:${env.PORT}`,
			);
		});
	} catch (error) {
		console.error("❌ Server startup failed:", error.message);
		process.exit(1);
	}
})();
