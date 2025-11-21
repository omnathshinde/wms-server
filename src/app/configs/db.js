import env from "#app/configs/env.js";
import logger from "#app/configs/logger.js";
import sequelize from "#app/database/index.js";
import tableRelationship from "#app/helpers/TableRelationship.js";

export default async () => {
	try {
		process.on("SIGINT", async () => {
			console.log("🔌 Closing DB connection...");
			await sequelize.close();
			console.log("❌ DB connection closed.");
			process.exit(0);
		});
		console.log("⏳ Connecting to database...");
		await sequelize.authenticate();

		if (env.NODE_ENV === "production") {
			console.log("🚫 Production mode: skipping auto-sync");
			await sequelize.sync();
		} else if (env.NODE_ENV === "staging") {
			await sequelize.sync({ alter: false });
			console.log("🧪 Staging mode: syncing with alter:false (safe sync)...");
		} else {
			await sequelize.sync();
			console.log("🧰 Development mode: syncing with alter:true ...");
		}

		const modelNames = Object.keys(sequelize.models);
		console.log("✅ Database connected successfully!");
		console.log("📌 Synchronized Models:", modelNames.length ? modelNames : "None");
		console.log("🔍 Table Relationships:");
		tableRelationship(sequelize);
	} catch (error) {
		logger.error("❌ Database connection failed:", error.message);
		console.error("❌ Database connection failed:", error.message);
		console.error(error);
		process.exit(1);
	}
};
