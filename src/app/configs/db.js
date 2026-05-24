import databaseError from "#/src/app/errors/databaseError.js";
import env from "#app/configs/env.js";
import logger from "#app/configs/logger.js";
import sequelize from "#app/database/index.js";
import tableRelationship from "#app/helpers/TableRelationship.js";

export default async () => {
	logger.info("⏳ Connecting to database...");
	try {
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
		logger.info("✅ Database connected successfully!");
		logger.info("📌 Synchronized Models:", modelNames.length ? modelNames : "None");
		logger.info("🔍 Table Relationships:");
		tableRelationship(sequelize);
	} catch (error) {
		databaseError(error);
		process.exit(1);
	} finally {
		logger.info("🧹 Database initialization attempt completed");
	}
};
